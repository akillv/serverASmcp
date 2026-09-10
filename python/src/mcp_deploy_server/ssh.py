"""Async SSH connection manager with connection pooling per server."""

import asyncio
from pathlib import Path
from typing import Any

import asyncssh

from .models import ServerEntry

_connections: dict[str, asyncssh.SSHClientConnection] = {}


def _build_connect_kwargs(server: ServerEntry) -> dict[str, Any]:
    kwargs: dict[str, Any] = {
        "host": server.host,
        "port": server.port,
        "username": server.username,
        "known_hosts": None,
        "connect_timeout": 10,
    }
    if server.auth_method == "password" and server.password:
        kwargs["password"] = server.password
    elif server.auth_method == "private_key":
        if server.private_key_path:
            kwargs["client_keys"] = [server.private_key_path]
        elif server.private_key:
            kwargs["client_keys"] = [(asyncssh.import_private_key(server.private_key))]
    return kwargs


async def get_connection(server: ServerEntry) -> asyncssh.SSHClientConnection:
    """Get or create a pooled SSH connection for a server."""
    conn = _connections.get(server.id)
    if conn is not None:
        try:
            # Liveness check
            result = await conn.run("true", check=False)
            if result.exit_code == 0:
                return conn
        except Exception:
            pass
        # Stale connection, remove
        _connections.pop(server.id, None)
        try:
            conn.close()
        except Exception:
            pass

    kwargs = _build_connect_kwargs(server)
    conn = await asyncssh.connect(**kwargs)
    _connections[server.id] = conn
    return conn


def close_connection(server_id: str) -> None:
    """Close a specific server connection."""
    conn = _connections.pop(server_id, None)
    if conn:
        conn.close()


def close_all_connections() -> None:
    """Close all pooled connections."""
    for conn in _connections.values():
        conn.close()
    _connections.clear()


async def exec_command(
    conn: asyncssh.SSHClientConnection,
    command: str,
    timeout_sec: int = 30,
) -> dict[str, Any]:
    """Execute a command and return exit_code, stdout, stderr."""
    try:
        result = await asyncio.wait_for(
            conn.run(command, check=False),
            timeout=timeout_sec,
        )
        return {
            "exit_code": getattr(result, "exit_status", 0) or 0,
            "stdout": result.stdout or "",
            "stderr": result.stderr or "",
        }
    except asyncio.TimeoutError:
        raise TimeoutError(f"Command timed out after {timeout_sec}s")


async def upload_content(
    conn: asyncssh.SSHClientConnection,
    content: str,
    remote_path: str,
) -> None:
    """Write content to a remote file via SFTP."""
    async with conn.start_sftp_client() as sftp:
        async with sftp.open(remote_path, "w") as f:
            await f.write(content)


async def upload_file(
    conn: asyncssh.SSHClientConnection,
    local_path: str,
    remote_path: str,
) -> None:
    """Upload a local file to a remote path via SFTP."""
    async with conn.start_sftp_client() as sftp:
        await sftp.put(local_path, remote_path)
