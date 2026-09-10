#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  loadServers,
  addServer,
  removeServer,
  findServer,
  findServerByName,
  loadEnvServer,
  getConfigDir,
  type ServerEntry,
  type AuditEntry,
} from "./types.js";
import { appendAudit } from "./config.js";
import {
  getConnection,
  closeConnection,
  closeAllConnections,
  execCommand,
  uploadFile,
  uploadContent,
} from "./ssh.js";

// ─── Load skill file content at startup ──────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_PATHS = [
  join(__dirname, "..", "skills", "server-as-mcp", "SKILL.md"),
  join(__dirname, "skills", "server-as-mcp", "SKILL.md"),
  join(process.cwd(), "skills", "server-as-mcp", "SKILL.md"),
];

let skillContent = "";
for (const p of SKILL_PATHS) {
  if (existsSync(p)) {
    skillContent = readFileSync(p, "utf-8");
    break;
  }
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "ServerAsMcp", version: "0.4.0" },
  { capabilities: { tools: {} } }
);

// ─── Helper: resolve server by ID or name ────────────────────────────────────

function resolveServer(idOrName: string): ServerEntry | undefined {
  return findServer(idOrName) || findServerByName(idOrName) || (idOrName === "default" ? loadEnvServer() ?? undefined : undefined);
}

// ─── Audit helper ────────────────────────────────────────────────────────────

function audit(toolName: string, serverName: string, args: Record<string, unknown>, result: string, durationMs?: number): void {
  const sanitized = { ...args };
  if ("password" in sanitized) sanitized.password = "***";
  if ("content" in sanitized && typeof sanitized.content === "string" && sanitized.content.length > 200) {
    sanitized.content = `[${sanitized.content.length} chars]`;
  }
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    toolName,
    serverName,
    argsSummary: JSON.stringify(sanitized),
    resultSummary: result,
    durationMs,
  };
  appendAudit(entry);
}

// ─── Tool: get_skill ─────────────────────────────────────────────────────────

server.tool(
  "get_skill",
  "Get the ServerAsMcp deployment skill instructions. Call this FIRST before deploying to understand the full workflow.",
  {},
  async () => {
    if (skillContent) {
      return { content: [{ type: "text", text: skillContent }] };
    }
    return {
      content: [{ type: "text", text: "Skill file not found. Follow these steps:\n1. add_server → check_status\n2. Git push if remote exists\n3. Install runtimes on server\n4. Clone repo → install deps\n5. Create systemd service → start\n6. Cloudflare DNS → point to server\n7. Verify loop → fix errors until live" }],
    };
  }
);

// ─── Tool: add_server ────────────────────────────────────────────────────────

server.tool(
  "add_server",
  "Add a target server. Call multiple times to add many servers.",
  {
    name: z.string().min(1).describe("Unique label (e.g. web-1)"),
    host: z.string().min(1).describe("IP or hostname"),
    port: z.number().int().min(1).max(65535).default(22).describe("SSH port"),
    username: z.string().min(1).default("root").describe("SSH username"),
    authMethod: z.enum(["password", "private_key"]).describe("Auth method"),
    password: z.string().optional().describe("SSH password"),
    privateKeyPath: z.string().optional().describe("Path to SSH key"),
    privateKey: z.string().optional().describe("SSH key content"),
  },
  async (args) => {
    const start = Date.now();
    try {
      if (findServerByName(args.name)) {
        const text = `Server name '${args.name}' already exists. Use a different name.`;
        audit("add_server", args.name, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      if (args.authMethod === "password" && !args.password) {
        const text = "Password is required when authMethod is 'password'.";
        audit("add_server", args.name, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      if (args.authMethod === "private_key" && !args.privateKeyPath && !args.privateKey) {
        const text = "privateKeyPath or privateKey is required when authMethod is 'private_key'.";
        audit("add_server", args.name, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      const entry: ServerEntry = {
        id: randomUUID(),
        name: args.name,
        host: args.host,
        port: args.port,
        username: args.username,
        authMethod: args.authMethod,
        password: args.password,
        privateKeyPath: args.privateKeyPath,
        privateKey: args.privateKey,
      };
      addServer(entry);
      const text = `Server '${args.name}' added (${args.username}@${args.host}:${args.port}). ID: ${entry.id}`;
      audit("add_server", args.name, args, text, Date.now() - start);
      return { content: [{ type: "text", text }] };
    } catch (err: any) {
      const text = `Error: ${err.message}`;
      audit("add_server", args.name || "?", args, text, Date.now() - start);
      return { content: [{ type: "text", text }], isError: true };
    }
  }
);

// ─── Tool: remove_server ─────────────────────────────────────────────────────

server.tool(
  "remove_server",
  "Remove a registered server by name or ID",
  {
    server: z.string().min(1).describe("Server name or ID"),
  },
  async (args) => {
    const start = Date.now();
    try {
      const entry = resolveServer(args.server);
      if (!entry) {
        const text = `Server '${args.server}' not found.`;
        audit("remove_server", args.server, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      const removed = removeServer(entry.id);
      closeConnection(entry.id);
      const text = removed ? `Server '${args.server}' removed.` : `Failed to remove.`;
      audit("remove_server", args.server, args, text, Date.now() - start);
      return { content: [{ type: "text", text }] };
    } catch (err: any) {
      const text = `Error: ${err.message}`;
      audit("remove_server", args.server, args, text, Date.now() - start);
      return { content: [{ type: "text", text }], isError: true };
    }
  }
);

// ─── Tool: list_servers ──────────────────────────────────────────────────────

server.tool(
  "list_servers",
  "List all registered servers",
  {},
  async () => {
    const servers = loadServers();
    const envServer = loadEnvServer();
    const all = [...servers];
    if (envServer && !servers.find(s => s.id === envServer.id)) {
      all.unshift(envServer);
    }
    if (all.length === 0) {
      return { content: [{ type: "text", text: "No servers registered. Use add_server to add one." }] };
    }
    const lines = all.map(s => {
      const auth = s.authMethod === "password" ? "password" : `key: ${s.privateKeyPath ?? "inline"}`;
      return `- ${s.name} → ${s.username}@${s.host}:${s.port} [${auth}] (id: ${s.id})`;
    });
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─── Tool: run_command ───────────────────────────────────────────────────────

server.tool(
  "run_command",
  "Execute any shell command as root on a specific server. No restrictions.",
  {
    server: z.string().min(1).describe("Server name or ID"),
    command: z.string().min(1).describe("Any shell command"),
    timeoutSec: z.number().int().min(1).max(3600).default(30).describe("Timeout in seconds"),
  },
  async (args) => {
    const start = Date.now();
    try {
      const entry = resolveServer(args.server);
      if (!entry) {
        const text = `Server '${args.server}' not found. Use list_servers to see available servers.`;
        audit("run_command", args.server, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      const client = await getConnection(entry);
      const result = await execCommand(client, args.command, args.timeoutSec * 1000);
      const output = [
        `Server: ${entry.name} (${entry.host})`,
        `Command: ${args.command}`,
        `Exit code: ${result.exitCode}`,
        result.stdout ? `\nSTDOUT:\n${result.stdout.trim()}` : "",
        result.stderr ? `\nSTDERR:\n${result.stderr.trim()}` : "",
      ].filter(Boolean).join("\n");
      audit("run_command", entry.name, args, `exit=${result.exitCode}`, Date.now() - start);
      return { content: [{ type: "text", text: output }] };
    } catch (err: any) {
      audit("run_command", args.server, args, `error=${err.message}`, Date.now() - start);
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

// ─── Tool: deploy_file ───────────────────────────────────────────────────────

server.tool(
  "deploy_file",
  "Upload files to a specific server and run deployment commands",
  {
    server: z.string().min(1).describe("Server name or ID"),
    files: z.array(
      z.object({
        localPath: z.string().optional().describe("Local file path"),
        content: z.string().optional().describe("Inline file content"),
        remotePath: z.string().min(1).describe("Destination path"),
      })
    ).min(1).describe("Files to upload"),
    remoteDir: z.string().default("/tmp").describe("Working directory"),
    commands: z.array(z.string()).default([]).describe("Commands to run after upload"),
  },
  async (args) => {
    const start = Date.now();
    try {
      const entry = resolveServer(args.server);
      if (!entry) {
        const text = `Server '${args.server}' not found.`;
        audit("deploy_file", args.server, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      const client = await getConnection(entry);
      const results: string[] = [];
      for (const file of args.files) {
        if (file.localPath) {
          await uploadFile(client, file.localPath, file.remotePath);
          results.push(`Uploaded ${file.localPath} → ${file.remotePath}`);
        } else if (file.content !== undefined) {
          await uploadContent(client, file.content, file.remotePath);
          results.push(`Wrote ${file.remotePath} (${file.content.length} chars)`);
        }
      }
      for (const cmd of args.commands) {
        const prefixed = `cd ${args.remoteDir} && ${cmd}`;
        try {
          const result = await execCommand(client, prefixed, 60000);
          const status = result.exitCode === 0 ? "OK" : `FAILED (exit ${result.exitCode})`;
          results.push(`$ ${cmd} → ${status}`);
          if (result.stderr.trim()) {
            results.push(`  stderr: ${result.stderr.trim().slice(0, 500)}`);
          }
        } catch (cmdErr: any) {
          results.push(`$ ${cmd} → ERROR: ${cmdErr.message}`);
        }
      }
      const text = [`Server: ${entry.name}`, ...results].join("\n");
      audit("deploy_file", entry.name, args, `${args.files.length} files, ${args.commands.length} commands`, Date.now() - start);
      return { content: [{ type: "text", text }] };
    } catch (err: any) {
      audit("deploy_file", args.server, args, `error=${err.message}`, Date.now() - start);
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

// ─── Tool: check_status ──────────────────────────────────────────────────────

server.tool(
  "check_status",
  "Test SSH connectivity to a specific server",
  {
    server: z.string().min(1).describe("Server name or ID"),
  },
  async (args) => {
    const start = Date.now();
    try {
      const entry = resolveServer(args.server);
      if (!entry) {
        const text = `Server '${args.server}' not found.`;
        audit("check_status", args.server, args, text, Date.now() - start);
        return { content: [{ type: "text", text }], isError: true };
      }
      const client = await getConnection(entry);
      const result = await execCommand(client, "echo ok && uname -a && whoami", 5000);
      const text = `${entry.name}: connected\n${result.stdout.trim()}`;
      audit("check_status", entry.name, args, "ok", Date.now() - start);
      return { content: [{ type: "text", text }] };
    } catch (err: any) {
      audit("check_status", args.server, args, `error=${err.message}`, Date.now() - start);
      return { content: [{ type: "text", text: `${args.server}: connection failed — ${err.message}` }], isError: true };
    }
  }
);

// ─── Tool: run_all ───────────────────────────────────────────────────────────

server.tool(
  "run_all",
  "Execute the same command on ALL registered servers",
  {
    command: z.string().min(1).describe("Command to run on every server"),
    timeoutSec: z.number().int().min(1).max(3600).default(30).describe("Timeout per server"),
  },
  async (args) => {
    const start = Date.now();
    const servers = loadServers();
    const envServer = loadEnvServer();
    if (envServer && !servers.find(s => s.id === envServer.id)) {
      servers.unshift(envServer);
    }
    if (servers.length === 0) {
      return { content: [{ type: "text", text: "No servers registered." }], isError: true };
    }
    const results: string[] = [];
    for (const entry of servers) {
      try {
        const client = await getConnection(entry);
        const result = await execCommand(client, args.command, args.timeoutSec * 1000);
        const status = result.exitCode === 0 ? "OK" : `FAILED (${result.exitCode})`;
        results.push(`${entry.name}: ${status}`);
        if (result.stdout.trim()) results.push(`  stdout: ${result.stdout.trim().slice(0, 200)}`);
        if (result.stderr.trim()) results.push(`  stderr: ${result.stderr.trim().slice(0, 200)}`);
      } catch (err: any) {
        results.push(`${entry.name}: ERROR — ${err.message}`);
      }
    }
    const text = [`Command on all ${servers.length} server(s): ${args.command}`, ...results].join("\n");
    audit("run_all", "*", args, `ran on ${servers.length}`, Date.now() - start);
    return { content: [{ type: "text", text }] };
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const envServer = loadEnvServer();
  const servers = loadServers();
  const total = servers.length + (envServer ? 1 : 0);
  console.error(
    `ServerAsMcp v0.4.0 (stdio) | ${total} server(s) registered | skill: ${skillContent ? "loaded" : "fallback"} | config: ${getConfigDir()}`
  );
  process.on("SIGINT", () => { closeAllConnections(); process.exit(0); });
  process.on("SIGTERM", () => { closeAllConnections(); process.exit(0); });
}

main().catch(console.error);
