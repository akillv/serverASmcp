"""Data models for server configuration and audit entries."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field


class ServerEntry(BaseModel):
    id: str
    name: str
    host: str
    port: int = 22
    username: str = "root"
    auth_method: str = Field(..., alias="authMethod", pattern="^(password|private_key)$")
    password: Optional[str] = None
    private_key_path: Optional[str] = Field(None, alias="privateKeyPath")
    private_key: Optional[str] = Field(None, alias="privateKey")

    model_config = {"populate_by_name": True}


class AuditEntry(BaseModel):
    timestamp: str
    tool_name: str
    server_name: str
    args_summary: str
    result_summary: str
    duration_ms: Optional[int] = None


CONFIG_DIR = Path.home() / ".mcp-deploy"
SERVERS_FILE = CONFIG_DIR / "servers.json"
AUDIT_FILE = CONFIG_DIR / "audit.log"


def ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_servers() -> list[ServerEntry]:
    ensure_config_dir()
    if not SERVERS_FILE.exists():
        return []
    try:
        data = json.loads(SERVERS_FILE.read_text("utf-8"))
        return [ServerEntry(**s) for s in data.get("servers", [])]
    except Exception:
        return []


def save_servers(servers: list[ServerEntry]) -> None:
    ensure_config_dir()
    SERVERS_FILE.write_text(
        json.dumps({"servers": [s.model_dump(by_alias=True, exclude_none=True) for s in servers]}, indent=2),
        "utf-8",
    )


def find_server(server_id: str) -> Optional[ServerEntry]:
    return next((s for s in load_servers() if s.id == server_id), None)


def find_server_by_name(name: str) -> Optional[ServerEntry]:
    return next((s for s in load_servers() if s.name == name), None)


def add_server(entry: ServerEntry) -> None:
    servers = load_servers()
    servers.append(entry)
    save_servers(servers)


def remove_server(server_id: str) -> bool:
    servers = load_servers()
    filtered = [s for s in servers if s.id != server_id]
    if len(filtered) == len(servers):
        return False
    save_servers(filtered)
    return True


def get_config_dir() -> str:
    return str(CONFIG_DIR)


def append_audit(
    tool_name: str,
    server_name: str,
    args_summary: str,
    result_summary: str,
    duration_ms: int | None = None,
) -> None:
    ensure_config_dir()
    entry = AuditEntry(
        timestamp=datetime.now(timezone.utc).isoformat(),
        tool_name=tool_name,
        server_name=server_name,
        args_summary=args_summary,
        result_summary=result_summary,
        duration_ms=duration_ms,
    )
    with open(AUDIT_FILE, "a") as f:
        f.write(entry.model_dump_json(exclude_none=True) + "\n")
