# 90-Second ServerAsMcp Demo Script

## Goal

Show one agent-native flow from a Git repository to a verified HTTPS URL, then show the deployment recovering after a deliberate failure.

## Pre-recording setup

- Use a disposable VPS and a dedicated SSH key.
- Use a test domain or subdomain you control.
- Prepare a small app repository with a start command and a known port.
- Prepare the MCP config, but do not reveal secrets.
- Set the terminal font large enough for mobile.
- Close tabs, notifications, and files containing private data.
- Enable recording of the screen and microphone.
- Prepare the exact prompt in a local file so you can paste it without typing a domain on camera.

## Opening frame: 0:00–0:05

**Screen:** Browser tab showing the target domain not resolving or showing the placeholder page. Terminal on the right.

**Spoken line:**

> This app is just a Git repo. I want my agent to make it live.

## Show MCP configuration: 0:05–0:12

**Screen:** Open the MCP client configuration, briefly showing only non-secret fields.

**Spoken line:**

> I configure one MCP server with SSH-key access to my Linux VPS. No custom agent integration.

**On-screen focus:**

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
        "SERVER_1_KEY_PATH": "/home/you/.ssh/id_ed25519"
      }
    }
  }
}
```

Use `203.0.113.5` in documentation; do not reveal a real host.

## One-prompt deployment: 0:12–0:30

**Screen:** Paste the prompt into the agent.

**Prompt to paste:**

```text
Deploy https://github.com/you/your-app to web-1 and make it live at app.example.com.
```

**Spoken line:**

> Then I ask it to deploy the repo and make it live.

**Expected agent actions to leave visible:**

- calls `get_skill`
- calls `check_status`
- prepares the server
- clones the repository
- installs dependencies
- creates or updates the systemd service

## Production setup: 0:30–0:50

**Screen:** Scroll the agent transcript while deployment proceeds.

**Spoken line:**

> It installs dependencies, creates the systemd service, checks localhost, and updates the Cloudflare A record.

**Highlight these beats if shown:**

- `systemctl enable` / `systemctl start`
- `curl localhost:PORT`
- Cloudflare A record creation or update
- public URL health check

## Live URL proof: 0:50–0:60

**Screen:** Open or refresh the browser at the live HTTPS URL.

**Spoken line:**

> It doesn’t just claim success. The service is active and the public URL responds.

**On-screen beat:** Show the browser loading the app.

## Failure injection: 0:60–0:72

**Screen:** In a separate terminal or through the agent, stop the service.

**Command example:**

```bash
systemctl stop your-app.service
```

**Spoken line:**

> Now I break it on purpose.

**Alternative safe failure for recording:** change the expected app port or rename the service file, then run the same verification.

## Self-healing proof: 0:72–0:86

**Screen:** Return to the agent and ask:

```text
web-1 looks down. Check it, fix the issue, and verify production again.
```

**Spoken line:**

> The agent checks status, reads logs, diagnoses the issue, repairs it, and retries.

**Highlight these beats if shown:**

- `systemctl status`
- `journalctl -u your-app.service`
- restart or configuration fix
- localhost and public URL verification

## Closing frame: 0:86–0:90

**Screen:** Show the live HTTPS URL one more time.

**Spoken line:**

> ServerAsMcp: the deployment MCP for agents that actually ships.

**End card:** Product name, GitHub URL, and `npx serverasmcp`.

## Caption / video description

```text
ServerAsMcp lets Codex, Claude, Cursor, and other MCP agents deploy a repo to a real Linux server, configure Cloudflare DNS, and self-heal failures until the HTTPS URL is live. Runs via npx or uvx. Deliberately unrestricted for trusted single-operator use—SSH-key auth recommended.

https://github.com/arun-raze19/serverASmcp
```

## Recording notes

- Keep the final video under 90 seconds if possible; a 2-minute version is acceptable for YouTube.
- Prefer a 16:9 video for GitHub/YouTube and a 9:16 crop for X and LinkedIn if you cut a short version.
- Add captions for silent autoplay.
- Export an MP4 plus a lightweight GIF only if the GIF remains under 10 MB.
- Do not show tokens, API keys, passwords, real IP addresses, audit logs with private hosts, or production domains.
