# GitHub Repository Metadata

## About / description

```text
Agent-native deployment MCP for Linux servers: run commands, deploy files, configure Cloudflare DNS, and self-heal until production is live.
```

## Website / homepage

```text
https://github.com/akillv/serverASmcp#readme
```

## Topics

```text
mcp
mcp-server
model-context-protocol
ai-agents
ssh
deployment
devops
self-hosted
cloudflare
dns
systemd
linux
automation
codex
claude
cursor
```

## Repository settings checklist

- Set **Description** to the text above.
- Set **Website** to the README URL above.
- Enable **Releases**, **Issues**, **Discussions**, and **Sponsorships** if desired.
- Set the default branch to `main`.
- Enable squash merging only if that matches the existing release workflow.
- Protect `main` from force pushes.
- Add topics from the list above.
- Upload a 1280×640 social preview image showing a terminal, a browser showing a live HTTPS URL, and the title:
  **One prompt. One VPS. Verified production.**
- Link the GitHub package metadata to the same repository URL.

## Release announcement template

```markdown
## ServerAsMcp vX.Y.Z

### What changed

- [User-visible improvement]
- [Bug or compatibility fix]
- [Documentation or trust improvement]

### Why it matters

[One sentence explaining how this makes the repository-to-live-URL workflow easier, faster, or safer.]

### Upgrade

```bash
npm install -g serverasmcp@latest
# or
pip install --upgrade serverasmcp
```

### Feedback

Open an issue with your MCP client, runtime, auth mode, and server type.
```

## Naming alignment checklist

Use these exact spellings in public assets:

- Product name: **ServerAsMcp**
- npm/PyPI package: **serverasmcp**
- Repository owner/path: **akillv/serverASmcp**

Before release, ensure every package metadata and source-clone URL points to `akillv/serverASmcp`.
