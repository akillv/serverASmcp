# Star Growth Execution Checklist

This checklist records what has been implemented in the repository and what still requires credentials or live infrastructure.

## Completed in repository

- [x] Add a contextual star CTA after the 30-second workflow.
- [x] Add a GitHub stars badge to both READMEs.
- [x] Create the first five example specifications: static site, Next.js, FastAPI, Docker Compose, and database-backed app.
- [x] Define production verification and cleanup requirements for every example.
- [x] Create a 1280×640 social-preview source and rendered PNG.
- [x] Add a clearly labeled 30-second simulated workflow preview in GIF and MP4 form.
- [x] Add a repeatable renderer for the workflow preview.
- [x] Keep the trust boundary visible in launch-facing materials.

## GitHub settings requiring repository-owner access

Set the repository About fields to:

```text
Description: Agent-native deployment MCP for Linux servers: run commands, deploy files, configure Cloudflare DNS, and self-heal until production is live.
Website: https://github.com/akillv/serverASmcp#readme
```

Set these topics:

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

Upload `marketing/social-preview/social-preview.png` at:

```text
https://github.com/akillv/serverASmcp/settings/social-preview
```

## Pinned issues to create

### Issue 1: Public roadmap

```markdown
## ServerAsMcp roadmap

This is the current prioritization based on the agent-native deployment workflow.

### P0 — make first deployment excellent

- [ ] Publish a polished 60–90 second demo
- [ ] Publish tested static-site example
- [ ] Publish tested Next.js example
- [ ] Publish tested FastAPI example
- [ ] Improve package pages and release notes

### P1 — safer operator controls

- [ ] Dry-run mode
- [ ] Confirmation gate for destructive commands
- [ ] Per-server command allowlists
- [ ] Document scoped SSH identities

### P2 — broaden deployment coverage

- [ ] Docker Compose example
- [ ] Database-backed application example
- [ ] More Cloudflare DNS failure handling
- [ ] Multi-server deployment patterns

Stars are useful, but successful first deployments are the real north-star metric.
```

### Issue 2: Example feedback

```markdown
## Which deployment example should be next?

I am adding tested examples for real Linux deployments.

Current priorities:

1. Static site
2. Next.js
3. FastAPI
4. Docker Compose
5. Database-backed app

Comment with:

- stack or framework,
- database or external service,
- port and start command,
- health-check path,
- whether systemd or Docker Compose is preferred.

The highest-repeat request will be implemented next. Please do not include credentials or private hosts.
```

### Issue 3: Good first issues

```markdown
## Good first issues

These are useful, small contributions:

- [ ] Test the npm quick start and report your runtime versions.
- [ ] Test the PyPI quick start and report your runtime versions.
- [ ] Improve the Next.js example prompt.
- [ ] Improve the FastAPI health-check example.
- [ ] Document a rollback workflow.
- [ ] Add a troubleshooting entry for a common SSH or DNS issue.

Read CONTRIBUTING.md and SECURITY.md before starting. Use a disposable server.
```

Pin those three issues after opening them.

## Release and launch prerequisites

- [ ] Publish a package release containing the updated README and metadata.
- [ ] Verify the npm page shows the new positioning.
- [ ] Verify the PyPI page shows the new positioning.
- [ ] Record the live 60–90 second disposable-VPS demo and replace the simulated workflow preview in the README.
- [ ] Submit to MCP directories.
- [ ] Open PRs to awesome MCP and AI-agent lists.
