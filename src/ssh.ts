import { Client, type ConnectConfig, type SFTPWrapper } from "ssh2";
import { readFileSync } from "fs";
import type { ServerEntry } from "./types.js";

const connections = new Map<string, Client>();

function buildConnectConfig(server: ServerEntry): ConnectConfig {
  const config: ConnectConfig = {
    host: server.host,
    port: server.port,
    username: server.username,
    readyTimeout: 10000,
  };

  if (server.authMethod === "password" && server.password) {
    config.password = server.password;
  } else if (server.authMethod === "private_key") {
    if (server.privateKeyPath) {
      config.privateKey = readFileSync(server.privateKeyPath, "utf-8");
    } else if (server.privateKey) {
      config.privateKey = server.privateKey;
    }
  }

  return config;
}

export async function getConnection(server: ServerEntry): Promise<Client> {
  // Check pool for existing connection
  const existing = connections.get(server.id);
  if (existing) {
    try {
      await new Promise<void>((resolve, reject) => {
        existing.exec("true", (err, stream) => {
          if (err) return reject(err);
          stream.on("close", () => resolve()).on("error", reject);
        });
      });
      return existing;
    } catch {
      connections.delete(server.id);
      existing.end();
    }
  }

  return new Promise((resolve, reject) => {
    const client = new Client();
    client.on("ready", () => {
      connections.set(server.id, client);
      resolve(client);
    });
    client.on("error", (err) => {
      reject(new Error(`SSH connection to ${server.host}:${server.port} failed: ${err.message}`));
    });
    client.connect(buildConnectConfig(server));
  });
}

export function closeConnection(serverId: string): void {
  const conn = connections.get(serverId);
  if (conn) {
    conn.end();
    connections.delete(serverId);
  }
}

export function closeAllConnections(): void {
  for (const [id, conn] of connections) {
    conn.end();
    connections.delete(id);
  }
}

export async function execCommand(
  client: Client,
  command: string,
  timeoutMs: number = 30000
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    client.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timer);
        return reject(err);
      }

      let stdout = "";
      let stderr = "";

      stream.on("close", (code: number | null) => {
        clearTimeout(timer);
        resolve({ exitCode: code ?? 0, stdout, stderr });
      });

      stream.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      stream.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
    });
  });
}

export async function uploadFile(
  client: Client,
  localPath: string,
  remotePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp: SFTPWrapper) => {
      if (err) return reject(err);
      const readStream = require("fs").createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on("close", () => { sftp.end(); resolve(); });
      writeStream.on("error", (err: Error) => { sftp.end(); reject(err); });
      readStream.pipe(writeStream);
    });
  });
}

export async function uploadContent(
  client: Client,
  content: string,
  remotePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp: SFTPWrapper) => {
      if (err) return reject(err);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on("close", () => { sftp.end(); resolve(); });
      writeStream.on("error", (err: Error) => { sftp.end(); reject(err); });
      writeStream.write(content);
      writeStream.end();
    });
  });
}
