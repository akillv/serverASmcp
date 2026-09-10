"""ServerAsMcp - main entry point."""

import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP
from mcp.types import TextContent

from .models import (
    ServerEntry,
    load_servers,
    find_server,
    find_server_by_name,
    add_server,
    remove_server,
    append_audit,
    get_config_dir,
)
from .ssh import (
    get_connection,
    close_connection,
    close_all_connections,
    exec_command,
    upload_content,
    upload_file,
)

app = FastMCP("ServerAsMcp")

# Load skill file
_SKILL_PATHS = [
    Path(__file__).parent.parent.parent / "skills" / "server-as-mcp" / "SKILL.md",
    Path(__file__).parent / "skills" / "server-as-mcp" / "SKILL.md",
    Path.cwd() / "skills" / "server-as-mcp" / "SKILL.md",
]

_skill_content = ""
for _p in _SKILL_PATHS:
    if _p.exists():
        _skill_content = _p.read_text("utf-8")
        break


def _resolve_server(id_or_name: str) -> ServerEntry | None:
    return find_server(id_or_name) or find_server_by_name(id_or_name)


def _sanitize_args(args: dict[str, Any]) -> str:
    sanitized = dict(args)
    if "password" in sanitized:
        sanitized["password"] = "***"
    if "content" in sanitized and isinstance(sanitized["content"], str) and len(sanitized["content"]) > 200:
        sanitized["content"] = f"[{len(sanitized['content'])} chars]"
    return json.dumps(sanitized)


@app.tool(name="get_skill", description="Get the ServerAsMcp deployment skill instructions. Call this FIRST before deploying.")
def _get_skill() -> str:
    return _skill_content or "Skill not found. Follow: add_server → check_status → git push → install deps → systemd → Cloudflare DNS → verify loop."


@app.tool(name="add_server", description="Add a target server. Call multiple times to add many servers.")
async def _add_server_tool(name: str, host: str, port: int = 22, username: str = "root", authMethod: str = "password", password: str | None = None, privateKeyPath: str | None = None, privateKey: str | None = None) -> str:
    return await _add_server({"name": name, "host": host, "port": port, "username": username, "authMethod": authMethod, "password": password, "privateKeyPath": privateKeyPath, "privateKey": privateKey})


@app.tool(name="list_servers", description="List all registered servers")
async def _list_servers_tool() -> str:
    return await _list_servers()


@app.tool(name="remove_server", description="Remove a server by name")
async def _remove_server_tool(server: str) -> str:
    return await _remove_server({"server": server})


@app.tool(name="run_command", description="Execute any shell command on a specific server. No restrictions.")
async def _run_command_tool(server: str, command: str, timeoutSec: int = 30) -> str:
    return await _run_command({"server": server, "command": command, "timeoutSec": timeoutSec})


@app.tool(name="run_all", description="Execute the same command on ALL servers")
async def _run_all_tool(command: str, timeoutSec: int = 30) -> str:
    return await _run_all({"command": command, "timeoutSec": timeoutSec})


@app.tool(name="deploy_file", description="Upload files and run commands on a specific server")
async def _deploy_file_tool(server: str, files: list[dict[str, Any]], remoteDir: str = "/tmp", commands: list[str] | None = None) -> str:
    return await _deploy_file({"server": server, "files": files, "remoteDir": remoteDir, "commands": commands or []})


@app.tool(name="check_status", description="Test SSH connectivity to a server")
async def _check_status_tool(server: str) -> str:
    return await _check_status({"server": server})


async def _add_server(args: dict[str, Any]) -> str:
    name = args.get("name", "")
    if find_server_by_name(name):
        return f"Server name '{name}' already exists. Use a different name."

    auth = args.get("authMethod", "password")
    if auth == "password" and not args.get("password"):
        return "Password is required when authMethod is 'password'."
    if auth == "private_key" and not args.get("privateKeyPath") and not args.get("privateKey"):
        return "privateKeyPath or privateKey is required when authMethod is 'private_key'."

    entry = ServerEntry(
        id=str(uuid.uuid4()),
        name=name,
        host=args.get("host", ""),
        port=args.get("port", 22),
        username=args.get("username", "root"),
        auth_method=auth,
        password=args.get("password"),
        private_key_path=args.get("privateKeyPath"),
        private_key=args.get("privateKey"),
    )
    add_server(entry)
    return f"Server '{name}' added ({entry.username}@{entry.host}:{entry.port}). ID: {entry.id}"


async def _list_servers() -> str:
    servers = load_servers()
    if not servers:
        return "No servers registered. Use add_server to add one."
    lines = []
    for s in servers:
        auth = "password" if s.auth_method == "password" else f"key: {s.private_key_path or 'inline'}"
        lines.append(f"- {s.name} → {s.username}@{s.host}:{s.port} [{auth}] (id: {s.id})")
    return "\n".join(lines)


async def _remove_server(args: dict[str, Any]) -> str:
    entry = _resolve_server(args.get("server", ""))
    if not entry:
        return f"Server '{args.get('server')}' not found."
    close_connection(entry.id)
    removed = remove_server(entry.id)
    return f"Server '{args.get('server')}' removed." if removed else "Failed to remove."


async def _run_command(args: dict[str, Any]) -> str:
    entry = _resolve_server(args.get("server", ""))
    if not entry:
        return f"Server '{args.get('server')}' not found. Use list_servers."

    try:
        conn = await get_connection(entry)
        result = await exec_command(conn, args["command"], args.get("timeoutSec", 30))
        output = [
            f"Server: {entry.name} ({entry.host})",
            f"Command: {args['command']}",
            f"Exit code: {result['exit_code']}",
        ]
        if result["stdout"]:
            output.append(f"\nSTDOUT:\n{result['stdout'].strip()}")
        if result["stderr"]:
            output.append(f"\nSTDERR:\n{result['stderr'].strip()}")
        return "\n".join(output)
    except Exception as e:
        return f"Error: {e}"


async def _run_all(args: dict[str, Any]) -> str:
    servers = load_servers()
    if not servers:
        return "No servers registered."

    results = [f"Command on all {len(servers)} server(s): {args['command']}"]
    for entry in servers:
        try:
            conn = await get_connection(entry)
            result = await exec_command(conn, args["command"], args.get("timeoutSec", 30))
            status = "OK" if result["exit_code"] == 0 else f"FAILED ({result['exit_code']})"
            results.append(f"{entry.name}: {status}")
            if result["stdout"]:
                results.append(f"  stdout: {result['stdout'].strip()[:200]}")
        except Exception as e:
            results.append(f"{entry.name}: ERROR — {e}")
    return "\n".join(results)


async def _deploy_file(args: dict[str, Any]) -> str:
    entry = _resolve_server(args.get("server", ""))
    if not entry:
        return f"Server '{args.get('server')}' not found."

    results = [f"Server: {entry.name}"]
    try:
        conn = await get_connection(entry)
        for f in args.get("files", []):
            if "localPath" in f:
                await upload_file(conn, f["localPath"], f["remotePath"])
                results.append(f"Uploaded {f['localPath']} → {f['remotePath']}")
            elif "content" in f:
                await upload_content(conn, f["content"], f["remotePath"])
                results.append(f"Wrote {f['remotePath']} ({len(f['content'])} chars)")

        remote_dir = args.get("remoteDir", "/tmp")
        for cmd in args.get("commands", []):
            try:
                result = await exec_command(conn, f"cd {remote_dir} && {cmd}", 60)
                status = "OK" if result["exit_code"] == 0 else f"FAILED ({result['exit_code']})"
                results.append(f"$ {cmd} → {status}")
                if result["stderr"]:
                    results.append(f"  stderr: {result['stderr'].strip()[:500]}")
            except Exception as e:
                results.append(f"$ {cmd} → ERROR: {e}")
    except Exception as e:
        results.append(f"Error: {e}")

    return "\n".join(results)


async def _check_status(args: dict[str, Any]) -> str:
    entry = _resolve_server(args.get("server", ""))
    if not entry:
        return f"Server '{args.get('server')}' not found."

    try:
        conn = await get_connection(entry)
        result = await exec_command(conn, "echo ok && uname -a && whoami", 5)
        return f"{entry.name}: connected\n{result['stdout'].strip()}"
    except Exception as e:
        return f"{args.get('server')}: connection failed — {e}"


def main() -> None:
    servers = load_servers()
    import sys
    print(
        f"ServerAsMcp v0.4.3 (stdio) | {len(servers)} server(s) | skill: {'loaded' if _skill_content else 'fallback'} | config: {get_config_dir()}",
        file=sys.stderr,
    )
    app.run("stdio")


if __name__ == "__main__":
    main()
