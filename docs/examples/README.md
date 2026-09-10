# ServerAsMcp Examples

These are launch examples for the first five deployment workflows. Each example should use a disposable VPS, SSH-key authentication, and a test domain.

## Status

| Example | Priority | Status | Primary acceptance signal |
|---|---|---|---|
| Static site | P0 | not started | Agent deploys files, creates service, updates DNS, and public HTTPS URL returns 200 |
| Next.js | P0 | not started | Production build starts under systemd and public URL returns expected page |
| FastAPI | P0 | not started | Uvicorn service runs under systemd and public API health endpoint returns 200 |
| Docker Compose | P1 | not started | Compose services are healthy and public URL routes to the app |
| Database-backed app | P1 | not started | Database service is healthy and an end-to-end write/read succeeds |

## Shared example contract

Every example must include:

1. A minimal application that starts from a clean VPS.
2. Exact MCP configuration using `SERVER_1_KEY_PATH`, with no credentials.
3. The exact agent prompt.
4. Expected tool calls or terminal phases.
5. A Cloudflare DNS step.
6. A systemd or Docker Compose service definition.
7. Production verification:
   - service is active,
   - localhost returns 200,
   - public HTTPS URL returns 200.
8. A rollback or cleanup command.

## Example 1: Static site

### Repository layout

```text
static-site/
  index.html
  style.css
```

### Prompt

```text
Deploy https://github.com/akillv/serverASmcp/examples/static-site to web-1 and make it live at static.example.com using nginx.
```

### Acceptance checks

```bash
systemctl is-active nginx
curl -I http://127.0.0.1
curl -I https://static.example.com
```

## Example 2: Next.js

### Requirements

- Node.js 20+
- `npm run build`
- `npm run start -- -p 3000`
- systemd service named `nextjs-app`

### Prompt

```text
Deploy https://github.com/akillv/serverASmcp/examples/nextjs to web-1 and make it live at nextjs.example.com.
```

### Acceptance checks

```bash
systemctl is-active nextjs-app
curl -I http://127.0.0.1:3000
curl -I https://nextjs.example.com
```

## Example 3: FastAPI

### Requirements

- Python 3.11+
- `uvicorn app.main:app --host 127.0.0.1 --port 8000`
- systemd service named `fastapi-app`
- public health endpoint at `/healthz`

### Prompt

```text
Deploy https://github.com/akillv/serverASmcp/examples/fastapi to web-1 and make it live at api.example.com.
```

### Acceptance checks

```bash
systemctl is-active fastapi-app
curl -f http://127.0.0.1:8000/healthz
curl -f https://api.example.com/healthz
```

## Example 4: Docker Compose

### Requirements

- Docker and Docker Compose installed on the server
- `docker compose up -d --build`
- health check for the application container
- public URL routed through the app service

### Prompt

```text
Deploy https://github.com/akillv/serverASmcp/examples/docker-compose to web-1 and make it live at compose.example.com.
```

### Acceptance checks

```bash
docker compose ps
docker compose exec app curl -f http://127.0.0.1:3000/healthz
curl -f https://compose.example.com/healthz
```

## Example 5: Database-backed app

### Requirements

- application service
- PostgreSQL or SQLite service appropriate to the example
- migration command
- `/healthz` endpoint that checks the database connection
- sample write/read integration test

### Prompt

```text
Deploy https://github.com/akillv/serverASmcp/examples/db-app to web-1, run migrations, and make it live at app.example.com.
```

### Acceptance checks

```bash
systemctl is-active db-app
systemctl is-active postgresql
curl -f http://127.0.0.1:3000/healthz
curl -f https://app.example.com/healthz
```

## Security rules

- Use disposable VPSes and test domains.
- Use a dedicated SSH key, preferably with limited access.
- Never commit hosts, domains, API tokens, passwords, or private keys.
- Redact Cloudflare and SSH values from screenshots.
- Test cleanup and rollback before publishing the example.
