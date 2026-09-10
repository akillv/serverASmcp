import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// ─── Multi-server config file ────────────────────────────────────────────────

export interface ServerEntry {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  password?: string;
  privateKeyPath?: string;
  privateKey?: string;
}

export interface ServersConfig {
  servers: ServerEntry[];
}

const CONFIG_DIR = join(homedir(), ".mcp-deploy");
const SERVERS_FILE = join(CONFIG_DIR, "servers.json");

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadServers(): ServerEntry[] {
  ensureConfigDir();
  if (!existsSync(SERVERS_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(SERVERS_FILE, "utf-8"));
    return raw.servers || [];
  } catch {
    return [];
  }
}

export function saveServers(servers: ServerEntry[]): void {
  ensureConfigDir();
  writeFileSync(SERVERS_FILE, JSON.stringify({ servers }, null, 2), "utf-8");
}

export function findServer(serverId: string): ServerEntry | undefined {
  return loadServers().find((s) => s.id === serverId);
}

export function findServerByName(name: string): ServerEntry | undefined {
  return loadServers().find((s) => s.name === name);
}

export function addServer(entry: ServerEntry): void {
  const servers = loadServers();
  servers.push(entry);
  saveServers(servers);
}

export function removeServer(serverId: string): boolean {
  const servers = loadServers();
  const filtered = servers.filter((s) => s.id !== serverId);
  if (filtered.length === servers.length) return false;
  saveServers(filtered);
  return true;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

// ─── Single-server env fallback (backward compat) ────────────────────────────

export function loadEnvServer(): ServerEntry | null {
  const host = process.env.DEPLOY_HOST;
  if (!host) return null;

  const password = process.env.DEPLOY_PASSWORD;
  const privateKeyPath = process.env.DEPLOY_KEY_PATH;
  const privateKey = process.env.DEPLOY_KEY;

  let authMethod: "password" | "private_key";
  if (privateKeyPath || privateKey) {
    authMethod = "private_key";
  } else if (password) {
    authMethod = "password";
  } else {
    return null;
  }

  return {
    id: "env-default",
    name: "default",
    host,
    port: parseInt(process.env.DEPLOY_PORT || "22", 10),
    username: process.env.DEPLOY_USER || "root",
    authMethod,
    password,
    privateKeyPath,
    privateKey,
  };
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEntry {
  timestamp: string;
  toolName: string;
  serverName: string;
  argsSummary: string;
  resultSummary: string;
  durationMs?: number;
}

// ─── Deployment file schema ──────────────────────────────────────────────────

export const DeploymentFileSchema = z.object({
  localPath: z.string().optional(),
  content: z.string().optional(),
  remotePath: z.string().min(1),
});
export type DeploymentFile = z.infer<typeof DeploymentFileSchema>;
