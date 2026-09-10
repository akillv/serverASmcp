"""MCP Deploy Server - main entry point."""

import json
import time
import uuid
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

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

app = Server("mcp-deploy-server")


def _resolve_server(id_or_name: str) -> ServerEntry | None:
    return find_server(id_or_name) or find_server_by_name(id_or_name)


def _sanitize_args(args: dict[str, Any]) -> str:
    sanitized = dict(args)
    if "password" in sanitized:
        sanitized["password"] = "***"
    if "content" in sanitized and isinstance(sanitized["content"], str) and len(sanitized["content"]) > 200:
        sanitized["content"] = f"[{len(sanitized['content'])} chars]"
    return json.dumps(sanitized)


TOOLS = [
    Tool(
        name="add_server",
        description="Add a target server. Call multiple times to add many servers.",
        inputSchema={
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Unique label (e.g. web-1)"},
                "host": {"type": "string", "description": "IP or hostname"},
                "port": {"type": "integer", "default": 22, "description": "SSH port"},
                "username": {"type": "string", "default": "root", "description": "SSH user"},
                "authMethod": {"type": "string", "enum": ["password", "private_key"]},
                "password": {"type": "string", "description": "SSH password"},
                "privateKeyPath": {"type": "string", "description": "Path to SSH key"},
                "privateKey": {"type": "string", "description": "SSH key content"},
            },
            "required": ["name", "host", "authMethod"],
        },
    ),
    Tool(
        name="list_servers",
        description="List all registered servers",
        inputSchema={"type": "object", "properties": {}},
    ),
    Tool(
        name="remove_server",
        description="Remove a server by name",
        inputSchema={
            "type": "object",
            "properties": {"server": {"type": "string", "description": "Server name"}},
            "required": ["server"],
        },
    ),
    Tool(
        name="run_command",
        description="Execute any shell command as root on a specific server. No restrictions.",
        inputSchema={
            "type": "object",
            "properties": {
                "server": {"type": "string", "description": "Server name or ID"},
                "command": {"type": "string", "description": "Shell command"},
                "timeoutSec": {"type": "integer", "default": 30},
            },
            "required": ["server", "command"],
        },
    ),
    Tool(
        name="run_all",
        description="Execute the same command on ALL servers",
        inputSchema={
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "timeoutSec": {"type": "integer", "default": 30},
            },
            "required": ["command"],
        },
    ),
    Tool(
        name="deploy_file",
        description="Upload files and run commands on a specific server",
        inputSchema={
            "type": "object",
            "properties": {
                "server": {"type": "string", "description": "Server name or ID"},
                "files": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "localPath": {"type": "string"},
                            "content": {"type": "string"},
                            "remotePath": {"type": "string"},
                        },
                        "required": ["remotePath"],
                    },
                    "minItems": 1,
                },
                "remoteDir": {"type": "string", "default": "/tmp"},
                "commands": {"type": "array", "items": {"type": "string"}, "default": []},
            },
            "required": ["server", "files"],
        },
    ),
    Tool(
        name="check_status",
        description="Test SSH connectivity to a server",
        inputSchema={
            "type": "object",
            "properties": {"server": {"type": "string"}},
            "required": ["server"],
        },
    ),
]


@app.list_tools()
async def list_tools() -> list[Tool]:
    return TOOLS


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    start = time.monotonic()

    if name == "add_server":
        result = await _add_server(arguments)
    elif name == "list_servers":
        result = await _list_servers()
    elif name == "remove_server":
        result = await _remove_server(arguments)
    elif name == "run_command":
        result = await _run_command(arguments)
    elif name == "run_all":
        result = await _run_all(arguments)
    elif name == "deploy_file":
        result = await _deploy_file(arguments)
    elif name == "check_status":
        result = await _check_status(arguments)
    else:
        result = f"Unknown tool: {name}"

    duration_ms = int((time.monotonic() - start) * 1000)
    server_name = arguments.get("server", arguments.get("name", "*"))
    append_audit(name, str(server_name), _sanitize_args(arguments), result[:200], duration_ms)
    return [TextContent(type="text", text=result)]


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


async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        servers = load_servers()
        import sys
        print(
            f"MCP Deploy Server v0.3.0 (stdio) | {len(servers)} server(s) registered | config: {get_config_dir()}",
            file=sys.stderr,
        )
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
