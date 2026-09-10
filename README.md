# ServerAsMcp

A multi-server MCP deployment tool. Define your servers in the config, and AI agents can execute any command, deploy files, and go live — via `npx` or `uvx`.

> **⚠️ This gives agents unrestricted root access. Only use with trusted agents on servers you own.**

## Quick Start

Copy-paste into your MCP client config. Replace the IPs and passwords with your own.

```json
{
  "mcpServers": {
    "deploy": {
      "command": "npx",
      "args": ["-y", "serverasmcp"],
      "env": {
        "SERVER_1_NAME": "web-1",
        "SERVER_1_HOST": "203.0.113.5",
        "SERVER_1_USER": "root",
        "SERVER_1_PASSWORD": "your-password-1",

        "SERVER_2_NAME": "db-1",
        "SERVER_2_HOST": "203.0.113.6",
        "SERVER_2_USER": "root",
        "SERVER_2_PASSWORD": "your-password-2",

        "SERVER_3_NAME": "cdn-1",
        "SERVER_3_HOST": "203.0.113.7",
        "SERVER_3_PORT": "2222",
        "SERVER_3_USER": "deploy",
        "SERVER_3_PASSWORD": "your-password-3"
      }
    }
  }
}
```

Add as many `SERVER_N_*` blocks as you need — `SERVER_4_*`, `SERVER_5_*`, etc.

### With SSH keys instead of passwords:

```json
{
  "env": {
    "SERVER_1_NAME": "web-1",
    "SERVER_1_HOST": "203.0.113.5",
    "SERVER_1_USER": "root",
    "SERVER_1_KEY_PATH": "/home/you/.ssh/id_rsa"
  }
}
```

## Environment variables per server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERVER_N_NAME` | No | `server-N` | Label used by the agent |
| `SERVER_N_HOST` | ✅ | — | IP address or hostname |
| `SERVER_N_PORT` | No | `22` | SSH port |
| `SERVER_N_USER` | No | `root` | SSH username |
| `SERVER_N_PASSWORD` | One of | — | SSH password |
| `SERVER_N_KEY_PATH` | One of | — | Path to SSH private key |
| `SERVER_N_KEY` | One of | — | SSH private key content |

## What the agent gets

8 tools:

| Tool | Description |
|------|-------------|
| `get_skill` | **Returns the full deployment skill** — call first |
| `list_servers` | Show all configured servers |
| `run_command` | Any shell command on a specific server |
| `run_all` | Same command on all servers |
| `deploy_file` | Upload files via SFTP + run commands |
| `check_status` | Test connectivity |
| `add_server` | Add a server at runtime (saved to `~/.mcp-deploy/servers.json`) |
| `remove_server` | Remove a runtime-added server |

## Example

```
You: "Run apt update on web-1"
Agent: calls run_command(server: "web-1", command: "apt update")

You: "Run df -h on all servers"
Agent: calls run_all(command: "df -h")

You: "Deploy this app to web-1 and make it live"
Agent: calls get_skill → follows the full deployment workflow
Agent: runs git clone, npm install, systemd, Cloudflare DNS
Agent: loops until the app is confirmed live at https://your-domain.com
```

## Storage

| File | Purpose |
|------|---------|
| `~/.mcp-deploy/servers.json` | Runtime-added servers |
| `~/.mcp-deploy/audit.log` | Append-only operation log |

Env-configured servers live in your MCP client config (not on disk).

## License

MIT
