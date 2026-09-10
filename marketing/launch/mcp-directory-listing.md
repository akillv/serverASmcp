# MCP Directory Listing

## Name

```text
ServerAsMcp
```

## 100-word description

```text
ServerAsMcp is an agent-native deployment MCP for real Linux servers. It lets Codex, Claude, Cursor, and other MCP agents deploy repositories over SSH/SFTP, install dependencies, create systemd services, update Cloudflare DNS, and self-heal failures until the public HTTPS URL is verified. The built-in workflow supports unlimited configured servers, runtime server registration, file uploads, status checks, and multi-server command execution. Runs locally as a stdio MCP server with npm and Python distributions. Designed for trusted single-operator environments; SSH-key authentication is recommended.
```

## Long description

ServerAsMcp turns MCP agents into Linux deployment operators. Configure a server with SSH credentials, then ask the agent to deploy a repository and make it live. The server exposes tools for SSH command execution, SFTP file deployment, status checks, runtime server management, and simultaneous commands across configured servers.

The built-in deployment skill provides a complete production workflow: detect and push the Git repository, prepare the server, install runtimes and dependencies, create a systemd service, configure a proxied Cloudflare A record, and verify that the service, localhost, and public HTTPS URL are healthy. When deployment fails, the agent can read logs, diagnose common issues, apply fixes, and retry up to ten times.

ServerAsMcp runs as a local stdio MCP process and opens no network listener. It is deliberately unrestricted for single-operator environments: the agent has the access of the configured SSH identity. SSH-key authentication, disposable or staging servers, local credentials, and audit-log review are recommended.

## Categories

- MCP servers
- DevOps and deployment
- SSH and server management
- Cloudflare and DNS
- AI agent tools
- Self-hosted infrastructure

## Search keywords

```text
mcp server, agent deployment, ssh mcp, linux deployment, ai devops, cloudflare dns, systemd deployment, vps deployment, self-healing deployment, model context protocol, codex mcp, claude mcp, cursor mcp
```

## Installation

### Node.js / npm

```bash
npx -y serverasmcp
```

### Python / uv

```bash
uvx serverasmcp
```

## Requirements

- Node.js 18+ for npm runtime, or Python 3.11+ for Python runtime
- An MCP client such as Codex, Claude Desktop, Cursor, or another stdio-compatible client
- One or more Linux servers reachable over SSH
- SSH key or password authentication
- Cloudflare API access only if DNS automation is needed

## Supported clients

Any MCP client that launches stdio MCP servers and supports tool calling, including Codex, Claude Desktop, and Cursor.

## Security

ServerAsMcp is designed for trusted single-operator environments. It provides no sandbox, allowlist, RBAC, or policy engine. The configured agent can execute arbitrary commands as the configured SSH identity. Use SSH keys, test on staging servers, keep credentials local, and do not connect untrusted agents or shared multi-tenant systems.

## Links

- Repository: https://github.com/akillv/serverASmcp
- npm: https://www.npmjs.com/package/serverasmcp
- PyPI: https://pypi.org/project/serverasmcp/
- Issues: https://github.com/akillv/serverASmcp/issues
- Security policy: https://github.com/akillv/serverASmcp/blob/main/SECURITY.md
