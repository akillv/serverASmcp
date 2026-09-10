# Contributing to ServerAsMcp

Thank you for improving ServerAsMcp. This project is intentionally focused: it is an agent-native deployment MCP for trusted single-operator Linux environments.

## Project principles

1. **Agent-native first.** Prefer workflows an MCP agent can execute and verify.
2. **Real-server utility.** Keep SSH, SFTP, systemd, Git, and DNS at the center.
3. **Honest trust boundary.** Do not obscure unrestricted command access.
4. **Small release surface.** Avoid speculative UI, cloud services, and enterprise control planes.
5. **Node and Python parity.** Treat compatibility differences as bugs unless clearly documented.

## Development setup

Requirements:

- Node.js 18 or later
- Python 3.11 or later for the Python implementation
- npm and `uv`/`uvx`
- A disposable Linux test server or local SSH container

```bash
git clone https://github.com/akillv/serverASmcp.git
cd serverASmcp
npm install
npm run build
```

## Test workflow

At minimum:

```bash
npm run build
```

For SSH behavior, use a disposable local or cloud server. Prefer a dedicated key and never reuse production credentials.

Test these paths before submitting SSH, SFTP, or deployment changes:

- SSH-key authentication
- password authentication, when relevant
- command execution
- SFTP upload
- `add_server`
- `remove_server`
- Node MCP client compatibility
- Python MCP client compatibility

## Reporting bugs

Open a [bug report](.github/ISSUE_TEMPLATE/bug-report.md) with:

- ServerAsMcp version
- Node or Python runtime version
- MCP client
- server OS and type
- auth mode
- minimal reproduction
- redacted output

## Proposing features

Open a [feature request](.github/ISSUE_TEMPLATE/feature-request.md). Explain the workflow, proposed tool behavior, security impact, and alternatives.

## Security

Do not open public issues for exploitable vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## Pull requests

1. Keep the change focused.
2. Update documentation if behavior changes.
3. Consider both Node and Python runtimes.
4. Run `npm run build`.
5. Describe testing and any security impact.
6. Keep commits and PR titles imperative: `fix: stabilize SSH reconnect`.

## Style

- Use clear Markdown headings and runnable examples.
- Prefer concrete workflow examples over abstract feature lists.
- Redact all credentials, IP addresses, domains, and tokens from screenshots or logs.
