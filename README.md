# ServerAsMcp

A multi-server MCP deployment tool. AI agents can add unlimited servers, execute any command, deploy files, and go live — via `npx` or `uvx`.

> **⚠️ This gives agents unrestricted root access. Only use with trusted agents on servers you own.**

## Quick Start

### Option 1: `npx` (Node.js)

```json
{
  "mcpServers": {
    "deploy": {
      "command": "npx",
      "args": ["-y", "serverasmcp"]
    }
  }
}
```

### Option 2: `uvx` (Python / uv)

```json
{
  "mcpServers": {
    "deploy": {
      "command": "uvx",
      "args": ["serverasmcp"]
    }
  }
}
```

That's it. No credentials needed upfront.

## How it works

When your agent connects, it gets 8 tools:

| Tool | Description |
|------|-------------|
| `get_skill` | **Returns the full deployment skill** — the agent should call this first |
| `add_server` | Add a target server (name, host, port, user, password or SSH key) |
| `list_servers` | List all registered servers |
| `remove_server` | Remove a server |
| `run_command` | Execute **any** shell command on a specific server |
| `run_all` | Execute the same command on **all** servers at once |
| `deploy_file` | Upload file(s) via SFTP + run commands after |
| `check_status` | Test SSH connectivity |

The `get_skill` tool returns the built-in deployment workflow:
1. Register server
2. Check Git → push if remote exists
3. Install runtimes on server
4. Clone repo → install dependencies
5. Create systemd service → start
6. Configure Cloudflare DNS → make it live
7. Self-healing verification loop → fix errors until production

## Example

```
You: "Deploy my app to web-1"
Agent: calls get_skill → reads the full deployment workflow
Agent: calls add_server (if not registered)
Agent: calls check_status → verify connectivity
Agent: calls run_command → git clone, npm install, systemctl start
Agent: calls run_command → Cloudflare API to set DNS
Agent: loops until the app is confirmed live
```

## Storage

| File | Purpose |
|------|---------|
| `~/.mcp-deploy/servers.json` | Registered servers + credentials |
| `~/.mcp-deploy/audit.log` | Append-only operation log |

## License

MIT
