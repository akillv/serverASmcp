# Production verification — 2026-09-10

## Scope

This verification tested the published production artifacts and GitHub-served source. It did **not** execute commands on a customer or production server because no authorized `PROD_SSH_*` environment variables were available to the reusable smoke client.

## Results

| Layer | Artifact / endpoint | Version | Result | Evidence |
|---|---|---|---:|---|
| GitHub source | `akillv/serverASmcp` `main` | current | PASS | Local and remote HEAD both `54cb73f86d6b9a8580bfadcb599324154e3be207`; raw README serves current positioning. |
| Node production package | npm `serverasmcp` | 0.4.6 | PASS | Installed through `npm exec`; MCP handshake succeeded; all 8 expected tools listed; `get_skill` returned content. |
| Python production package | PyPI `serverasmcp` | 0.4.6 | PASS | Installed in isolated Python 3.14 venv; MCP handshake succeeded; all 8 expected tools listed; `get_skill` returned content. |
| Repository-side security | tracked files | current | PASS | Build passed; launch/security review passed; no literal production host or credential remains in tracked or local smoke scripts. |
| GitHub About metadata | repository settings | current | FAIL | API returned no description, homepage, or topics. |
| npm package page | registry metadata | 0.4.6 | STALE | Description still uses the old positioning and the indexed README does not contain the new hero. |
| PyPI package page | registry metadata | 0.4.6 | STALE | Summary/description still use the old positioning. |
| Real remote SSH smoke | production host | n/a | NOT RUN | Requires authorized `PROD_SSH_HOST`, `PROD_SSH_USER`, and either `PROD_SSH_KEY_PATH` or `PROD_SSH_PASSWORD`. |

## Production smoke command

The reusable client is `scripts/production-smoke.mjs`. It performs only these non-destructive checks:

1. MCP handshake
2. tool-list contract
3. deployment skill retrieval
4. runtime server registration
5. SSH connectivity
6. `whoami`
7. unique marker-file upload and exact-content verification
8. runtime server deregistration

Run from a clean checkout:

```bash
export PROD_SSH_HOST='production.example.test'
export PROD_SSH_USER='limited-user'
export PROD_SSH_KEY_PATH="$HOME/.ssh/serverasmcp-production-test"

node scripts/production-smoke.mjs
```

For the published npm artifact:

```bash
SMOKE_SERVER_COMMAND=npm \
SMOKE_SERVER_ARGS='["exec","--yes","--package=serverasmcp@latest","--","serverasmcp"]' \
node scripts/production-smoke.mjs
```

Use a disposable server or a dedicated limited SSH identity. Do not store credentials in scripts, command history, screenshots, or issue reports.

## Release gaps

The code pushed to GitHub is current, but npm and PyPI still expose the previous 0.4.6 metadata. A new release—for example 0.4.7—is required to publish the repositioned descriptions and READMEs to the package pages.
