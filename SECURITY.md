# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| latest published npm/PyPI release | yes |
| older releases | best effort |

## Trust model

ServerAsMcp is **deliberately unrestricted for single-operator environments**.

The configured MCP agent can execute arbitrary commands as the configured SSH identity. There is no sandbox, allowlist, policy engine, or multi-user authorization layer. This is a feature for a trusted operator and unacceptable risk for untrusted agents, multi-tenant platforms, or shared enterprise fleets.

Before use:

- Prefer SSH-key authentication.
- Use a dedicated key with the minimum access that still works for the target.
- Test on a disposable server or staging server first.
- Keep MCP configuration and runtime credentials local.
- Never share MCP configuration, screenshots, logs, or audit files containing credentials.
- Review `~/.mcp-deploy/audit.log`.
- Rotate the SSH key or password immediately if an agent, client machine, or credential may be compromised.

## Reporting a vulnerability

Do **not** report exploitable details in a public GitHub issue.

Use GitHub private vulnerability reporting for `arun-raze19/serverASmcp` if available. If unavailable, contact the maintainer through a private channel listed on the GitHub profile.

Include:

- affected version and runtime
- affected tool or transport path
- impact and exploitation conditions
- minimal reproduction
- redacted logs or traces

Please allow reasonable time for a fix before publishing technical details.

## General support

For configuration help, deployment failures, or feature discussion, open a normal GitHub issue. Remove credentials, private IP addresses, hostnames, domains, tokens, and sensitive logs first.
