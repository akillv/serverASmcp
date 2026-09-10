import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AuditEntry } from "./types.js";
import { ensureConfigDir } from "./types.js";

const AUDIT_FILE = join(homedir(), ".mcp-deploy", "audit.log");

export function appendAudit(entry: AuditEntry): void {
  ensureConfigDir();
  appendFileSync(AUDIT_FILE, JSON.stringify(entry) + "\n", "utf-8");
}

export function getConfigDir(): string {
  return join(homedir(), ".mcp-deploy");
}
