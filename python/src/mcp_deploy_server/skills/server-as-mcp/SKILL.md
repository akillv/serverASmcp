---
name: server-as-mcp
description: Deploy applications to remote Linux servers via MCP with Git integration, Cloudflare DNS, and self-healing production loop
triggers: [deploy, server deploy, deploy app, push and deploy, cloudflare dns, make it live, go live, production deploy]
argument-hint: "[server-name] [--repo <git-url>] [--cf-token <token>] [--domain <domain>]"
---

# Server as MCP — Full Production Deployment

## Purpose

Deploy any application to a remote Linux server via the `mcp-deploy-server` MCP tools.
Handles Git detection/push, dependency installation, service startup, Cloudflare DNS
configuration, and a self-healing verification loop until the app is live in production.

The agent operating this skill must have the `mcp-deploy-server` MCP tools available
(`add_server`, `list_servers`, `run_command`, `run_all`, `deploy_file`, `check_status`).

---

## When to Activate

- User says "deploy", "push and deploy", "make it live", "go to production"
- User wants to deploy an app from Git (or local directory) to a server
- User wants Cloudflare DNS configured so the app is publicly accessible
- User wants automated error-fixing until deployment succeeds

## When NOT to Activate

- User asks for local-only testing (no server involved)
- User asks to modify code without deploying
- User asks about DNS without deploying an app

---

## Prerequisites Check

Before starting, verify the agent has access to:

1. **MCP Deploy Server tools** — Run `list_servers` to confirm MCP connection
2. **Target server** — Either already registered or user provides credentials
3. **Git repository** — The project should have a Git remote (or offer to init one)
4. **Cloudflare API token** — Required for DNS configuration (ask user if not provided)

If any prerequisite is missing, ask the user explicitly. Do not guess.

---

## Deployment Workflow

Follow these phases **in order**. Do not skip phases.

### Phase 1: Server Registration

If the target server is not yet registered:

```
Ask user for:
- Server name (e.g. "web-1")
- IP address or hostname
- SSH port (default 22)
- Username (default "root")
- Password OR path to SSH private key
```

Then call `add_server`:

```
Tool: add_server
Arguments:
  name: <server-name>
  host: <ip-or-hostname>
  port: <port>
  username: <username>
  authMethod: password | private_key
  password: <password>          (if password auth)
  privateKeyPath: <key-path>    (if key auth)
```

Verify connectivity:

```
Tool: check_status
Arguments:
  server: <server-name>
```

**Expected output:** `<server-name>: connected` + system info.
If connection fails, report the error and stop. Do not retry indefinitely.

---

### Phase 2: Git Detection & Push

#### 2a. Check if the project has a Git remote

Run locally (in the project directory):

```bash
git remote -v
```

**If a remote exists:**
- Push latest changes: `git add -A && git commit -m "deploy" && git push`
- If push fails due to authentication, help the user set up `gh auth login` or SSH keys
- Record the Git URL for later use

**If no remote exists:**
- Ask the user: "This project has no Git remote. Would you like me to:
  1. Initialize a Git repo and push to GitHub/GitLab (you'll need to create the repo)
  2. Deploy from local files directly (no Git)
  3. Stop and set up Git first"

**Do NOT proceed to Phase 3 without resolving Git status.**

#### 2b. Prepare the deployment payload

Determine what to deploy:

- **If deploying from Git**: The server will `git clone` the repo. You need the repo URL.
- **If deploying from local files**: Use `deploy_file` to upload the project directory.

For Git-based deployment, verify the repo is accessible:

```bash
git ls-remote <repo-url> HEAD
```

If it returns a commit hash, the repo is accessible.

---

### Phase 3: Server Preparation

Check and install required runtimes on the target server.

#### 3a. Detect the project type

Look for these files in the project:

| File | Project type |
|------|-------------|
| `package.json` | Node.js |
| `requirements.txt` or `pyproject.toml` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `Dockerfile` | Docker |
| `docker-compose.yml` | Docker Compose |
| `.much` or `Makefile` | Custom build |

#### 3b. Install required runtime on the server

Check what's installed:

```
Tool: run_command
Arguments:
  server: <server-name>
  command: node --version 2>/dev/null; python3 --version 2>/dev/null; go version 2>/dev/null; docker --version 2>/dev/null
```

Based on project type, install missing runtimes:

**Node.js (if missing):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
```

**Python (if missing):**
```bash
apt-get update && apt-get install -y python3 python3-pip python3-venv
```

**Docker (if missing):**
```bash
curl -fsSL https://get.docker.com | sh
```

**Git (if missing):**
```bash
apt-get update && apt-get install -y git
```

**Always verify after install:**
```
Tool: run_command
Arguments:
  server: <server-name>
  command: node --version && git --version && npm --version
```

---

### Phase 4: Deploy Application

#### 4a. Git-based deployment (preferred)

Clone the repo on the server:

```
Tool: run_command
Arguments:
  server: <server-name>
  command: |
    cd /opt
    rm -rf app
    git clone <repo-url> app
    cd app
    git log --oneline -1
```

#### 4b. File-based deployment (fallback)

If no Git repo, upload essential files:

```
Tool: deploy_file
Arguments:
  server: <server-name>
  files: [<project files>]
  remoteDir: /opt/app
  commands: []
```

For directories, create a tarball locally first:

```bash
tar czf /tmp/app.tar.gz -C <project-dir> .
```

Then upload and extract:

```
Tool: deploy_file
Arguments:
  server: <server-name>
  files: [{ localPath: "/tmp/app.tar.gz", remotePath: "/opt/app.tar.gz" }]
  commands:
    - mkdir -p /opt/app
    - tar xzf /opt/app.tar.gz -C /opt/app
    - cd /opt/app && ls -la
```

#### 4c. Install dependencies

Based on project type:

**Node.js:**
```
Tool: run_command
Arguments:
  server: <server-name>
  command: cd /opt/app && npm install --production
  timeoutSec: 120
```

**Python:**
```
Tool: run_command
Arguments:
  server: <server-name>
  command: cd /opt/app && pip3 install -r requirements.txt
  timeoutSec: 120
```

**Docker:**
```
Tool: run_command
Arguments:
  server: <server-name>
  command: cd /opt/app && docker compose up -d --build
  timeoutSec: 300
```

---

### Phase 5: Configure & Start Service

#### 5a. Determine how to run the app

| Project type | Command |
|-------------|---------|
| Node.js | `npm start` or `node index.js` |
| Python | `python3 main.py` or `uvicorn app:app --host 0.0.0.0 --port 3000` |
| Docker | Already running from compose |
| Static site | Serve with `npx serve` or nginx |

#### 5b. Create a systemd service (for non-Docker apps)

```
Tool: deploy_file
Arguments:
  server: <server-name>
  files:
    - content: |
        [Unit]
        Description=App Service
        After=network.target

        [Service]
        Type=simple
        User=root
        WorkingDirectory=/opt/app
        ExecStart=<start-command>
        Restart=always
        RestartSec=5
        Environment=NODE_ENV=production
        Environment=PORT=3000

        [Install]
        WantedBy=multi-user.target
      remotePath: /etc/systemd/system/app.service
  commands:
    - systemctl daemon-reload
    - systemctl enable app
    - systemctl start app
    - sleep 3
    - systemctl status app
```

#### 5c. Verify the app is running

```
Tool: run_command
Arguments:
  server: <server-name>
  command: |
    systemctl is-active app
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
    journalctl -u app --no-pager -n 20
```

**Expected:** `active` + HTTP status code (200/301/302).

---

### Phase 6: Cloudflare DNS Configuration

#### 6a. Get Cloudflare API token from user

Ask: "What is your Cloudflare API token? You can create one at https://dash.cloudflare.com/profile/api-tokens with Zone.DNS.Edit permission."

Also ask: "What domain/subdomain should point to this server? (e.g. app.mydomain.com)"

#### 6b. Get the Zone ID

```
Tool: run_command
Arguments:
  server: <server-name>
  command: >
    curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=<domain>" \
      -H "Authorization: Bearer <cf-token>" \
      -H "Content-Type: application/json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d['result'] else 'NOT_FOUND')"
```

Record the Zone ID.

#### 6c. Get the server's public IP

```
Tool: run_command
Arguments:
  server: <server-name>
  command: curl -s https://ifconfig.me
```

#### 6d. Create or update the DNS record

First check if record exists:

```
Tool: run_command
Arguments:
  server: <server-name>
  command: >
    curl -s -X GET "https://api.cloudflare.com/client/v4/zones/<zone-id>/dns_records?name=<subdomain>" \
      -H "Authorization: Bearer <cf-token>" \
      -H "Content-Type: application/json"
```

If record exists, update it:
```bash
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/<zone-id>/dns_records/<record-id>" \
  -H "Authorization: Bearer <cf-token>" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"<subdomain>","content":"<server-ip>","ttl":300,"proxied":true}'
```

If new, create it:
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/<zone-id>/dns_records" \
  -H "Authorization: Bearer <cf-token>" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"<subdomain>","content":"<server-ip>","ttl":300,"proxied":true}'
```

**Verify response:** Look for `"success": true` in the JSON response.

---

### Phase 7: Production Verification Loop

This is the **self-healing** phase. Run the following loop until the app is confirmed live.

```
SET max_attempts = 10
SET attempt = 1

WHILE attempt <= max_attempts:
    # Check 1: Is the service running?
    systemctl_status = run_command("systemctl is-active app")
    IF systemctl_status != "active":
        LOG "Service not running. Restarting..."
        run_command("systemctl restart app")
        WAIT 5 seconds
        CONTINUE

    # Check 2: Is the app responding locally?
    http_code = run_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
    IF http_code is NOT in [200, 301, 302, 304]:
        LOG f"Local check failed with HTTP {http_code}. Checking logs..."
        logs = run_command("journalctl -u app --no-pager -n 50")
        ANALYZE logs for common errors (see Error Fix Reference below)
        ATTEMPT FIX
        CONTINUE

    # Check 3: Is the public URL responding?
    public_code = run_command(f"curl -s -o /dev/null -w '%{http_code}' https://<domain>/")
    IF public_code is NOT in [200, 301, 302, 304]:
        IF public_code is "000" or "timeout":
            LOG "DNS may not have propagated yet. Waiting..."
            WAIT 30 seconds
        ELSE:
            LOG f"Public check failed with HTTP {public_code}. Checking..."
            run_command("curl -v https://<domain>/ 2>&1 | tail -20")
        CONTINUE

    # ALL CHECKS PASSED
    REPORT "✅ App is LIVE at https://<domain>"
    REPORT f"  - Server: {server_name} ({server_host})"
    REPORT f"  - Service: app (systemd)"
    REPORT f"  - HTTP status: {public_code}"
    REPORT f"  - DNS: {subdomain} → {server_ip} (Cloudflare proxied)"
    BREAK

    INCREMENT attempt
```

**If all 10 attempts fail, report all logs and stop. Do not silently give up.**

---

## Error Fix Reference

When the verification loop detects a failure, check these common errors and auto-fix:

### Service won't start

**Symptom:** `systemctl status app` shows "failed" or "inactive"

**Check logs:**
```bash
journalctl -u app --no-pager -n 50
```

**Common causes & fixes:**

| Error in logs | Fix |
|--------------|-----|
| `MODULE_NOT_FOUND` | `cd /opt/app && npm install` |
| `EADDRINUSE` | `kill $(lsof -t -i:3000)` then restart |
| `Cannot find module 'express'` | `cd /opt/app && npm install express` |
| `SyntaxError` | Code has a bug. Report to user. |
| `Permission denied` | `chmod +x /opt/app/index.js` or check file permissions |
| `ENOENT: no such file` | Missing file. Check what file and create/fix. |
| `Connection refused` (DB) | Check if database is running: `systemctl status postgresql` or `docker ps` |
| `ECONNREFUSED` | Port mismatch. Check `.env` file for PORT variable. |

### App crashes on startup

**Check:**
```bash
cd /opt/app && node index.js 2>&1 | head -20
```

This shows the actual error. Fix based on what's shown.

### Port not accessible

**Check:**
```bash
ss -tlnp | grep 3000
ufw status
```

**Fix:**
```bash
ufw allow 3000/tcp
```

### DNS not resolving

**Check:**
```bash
dig <domain> +short
nslookup <domain>
```

**Fix:**
- Wait 5 minutes (Cloudflare propagation)
- Verify DNS record in Cloudflare dashboard
- Check that Cloudflare proxy is enabled (orange cloud)

### SSL/TLS errors

**Check:**
```bash
curl -v https://<domain>/ 2>&1 | grep -E "SSL|certificate|error"
```

**Fix:**
- In Cloudflare: SSL/TLS → Overview → Set to "Full (strict)" or "Full"
- If origin server needs SSL: install certbot and run `certbot --nginx -d <domain>`

---

## Logging Requirements

Throughout the entire deployment, the agent must:

1. **Announce each phase** before executing it
2. **Show command output** for every `run_command` result
3. **Report errors immediately** — don't wait until the end
4. **Log all fixes attempted** — what was tried and whether it worked
5. **Provide a deployment summary** at the end with:
   - Server name and IP
   - Git commit deployed (or file list)
   - Application URL
   - DNS record status
   - Any issues encountered and how they were resolved
   - Final HTTP status from public URL

---

## Environment Variables & Secrets

If the project has a `.env.example` or requires environment variables:

1. Ask the user for required values
2. Create a `.env` file on the server:

```
Tool: deploy_file
Arguments:
  server: <server-name>
  files:
    - content: |
        DATABASE_URL=<value>
        API_KEY=<value>
        NODE_ENV=production
      remotePath: /opt/app/.env
  commands: []
```

3. Ensure the systemd service loads them (add `EnvironmentFile=/opt/app/.env` to the service file)

---

## Rollback Procedure

If deployment fails irrecoverably and the user wants to rollback:

```bash
# Find previous working version
cd /opt/app && git log --oneline -10

# Rollback to previous commit
git checkout HEAD~1

# Rebuild and restart
npm install
systemctl restart app
```

---

## Multiple Servers

If the user wants to deploy to multiple servers:

1. Register all servers via `add_server`
2. Deploy to each server individually (not `run_all` — deployment is stateful)
3. Configure DNS with load balancing (multiple A records, or Cloudflare Load Balancer)
4. Verify each server independently

---

## Quick Reference

```
PHASE 1: add_server → check_status
PHASE 2: git remote -v → git push (or ask user)
PHASE 3: check runtimes → install if missing
PHASE 4: git clone on server → npm install
PHASE 5: create systemd service → start → verify locally
PHASE 6: Cloudflare API → create DNS record → verify
PHASE 7: verification loop → fix errors → confirm production
```

---

## Full Deployment Summary Template

```
══════════════════════════════════════════════════════
  DEPLOYMENT SUMMARY
══════════════════════════════════════════════════════

  Status: ✅ LIVE

  Server:    web-1 (203.0.113.5)
  Git:       main @ abc1234
  App:       /opt/app
  Service:   app.service (systemd, active)
  Port:      3000
  URL:       https://app.mydomain.com
  DNS:       A record → 203.0.113.5 (Cloudflare proxied)
  SSL:       Cloudflare Full (strict)

  Issues found & fixed:
    1. Missing express → npm install
    2. Port 3000 blocked → ufw allow 3000

  Verified:
    - systemctl is-active app → active
    - curl localhost:3000 → 200 OK
    - curl https://app.mydomain.com → 200 OK

══════════════════════════════════════════════════════
```
