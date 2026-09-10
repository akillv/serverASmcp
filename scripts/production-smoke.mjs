import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const host = process.env.PROD_SSH_HOST;
const user = process.env.PROD_SSH_USER;
const password = process.env.PROD_SSH_PASSWORD;
const keyPath = process.env.PROD_SSH_KEY_PATH;
const serverCommand = process.env.SMOKE_SERVER_COMMAND ?? process.execPath;
const serverArgs = process.env.SMOKE_SERVER_ARGS ? JSON.parse(process.env.SMOKE_SERVER_ARGS) : ['dist/index.js'];
if (!host || !user || (!password && !keyPath)) {
  console.error('Required: PROD_SSH_HOST, PROD_SSH_USER, and either PROD_SSH_KEY_PATH or PROD_SSH_PASSWORD');
  process.exit(2);
}
  const transport = new StdioClientTransport({
  command: serverCommand,
  args: serverArgs,
  env: {
    ...(process.env),
    SERVER_1_NAME: 'production-smoke',
    SERVER_1_HOST: host,
    SERVER_1_USER: user,
    SERVER_1_PORT: process.env.PROD_SSH_PORT ?? '22',
    ...(keyPath ? { SERVER_1_KEY_PATH: keyPath } : { SERVER_1_PASSWORD: password }),
  },
});
let client;
try {
client = new Client({ name: 'serverasmcp-production-smoke', version: '1.0.0' });
await client.connect(transport);
const tools = await client.listTools();
const expected = ['add_server','check_status','deploy_file','get_skill','list_servers','remove_server','run_all','run_command'];
const actual = tools.tools.map(tool => tool.name).sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`tool mismatch: ${actual.join(',')}`);
}
const skill = await client.callTool({ name: 'get_skill', arguments: {} });
if (!skill.content?.[0]?.text?.includes('7-phase')) throw new Error('deployment skill not found');
const marker = `production-smoke-${Date.now()}`;
const add = await client.callTool({
  name: 'add_server',
  arguments: {
    name: marker, host, port: Number(process.env.PROD_SSH_PORT ?? 22), username: user,
    authMethod: keyPath ? 'private_key' : 'password',
    ...(keyPath ? { privateKeyPath: keyPath } : { password }),
  },
});
if (add.isError) throw new Error(`add_server failed: ${add.content?.[0]?.text}`);
const status = await client.callTool({ name: 'check_status', arguments: { server: marker } });
if (status.isError || !String(status.content?.[0]?.text).includes('connected')) {
  throw new Error(`check_status failed: ${status.content?.[0]?.text}`);
}
const run = await client.callTool({
  name: 'run_command',
  arguments: { server: marker, command: 'whoami && printf SMOKE_RUN_OK', timeoutSec: 10 },
});
if (run.isError || !String(run.content?.[0]?.text).includes('SMOKE_RUN_OK')) {
  throw new Error(`run_command failed: ${run.content?.[0]?.text}`);
}
const remotePath = `/tmp/${marker}.txt`;
const deploy = await client.callTool({
  name: 'deploy_file',
  arguments: {
    server: marker,
    files: [{ content: `${marker}\n`, remotePath }],
    remoteDir: '/tmp',
    commands: [`grep -Fqx '${marker}' '${remotePath}'`],
  },
});
if (deploy.isError) throw new Error(`deploy_file failed: ${deploy.content?.[0]?.text}`);
const remove = await client.callTool({ name: 'remove_server', arguments: { server: marker } });
if (remove.isError) throw new Error(`remove_server failed: ${remove.content?.[0]?.text}`);
console.log('TOOLS', actual.join(','));
console.log('SKILL true');
console.log('CONNECT true');
console.log('RUN_COMMAND true');
console.log('SFTP_DEPLOY true');
console.log('REGISTRATION true');
console.log('RESULT PRODUCTION_SMOKE_PASSED');
await client.close();

} finally {
  await client?.close();
}
