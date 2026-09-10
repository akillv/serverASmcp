#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-akillv/serverASmcp}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is required. Install it from https://cli.github.com/" >&2
  exit 1
fi

if [[ -z "${GH_TOKEN:-}" && -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GH_TOKEN or GITHUB_TOKEN to a token with repository administration access." >&2
  exit 1
fi

export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN}}"

gh repo edit "$REPO" \
  --description "Agent-native deployment MCP for Linux servers: run commands, deploy files, configure Cloudflare DNS, and self-heal until production is live." \
  --homepage "https://github.com/akillv/serverASmcp#readme"

while IFS= read -r topic; do
  gh repo edit "$REPO" --add-topic "$topic"
done <<'TOPICS'
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
TOPICS

echo "GitHub description, homepage, and topics updated for $REPO."
echo "Upload marketing/social-preview/social-preview.png at https://github.com/$REPO/settings/social-preview"
