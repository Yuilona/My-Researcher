import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

export type LocalScriptExecutionRoot = {
  root: string;
  cleanup(): Promise<void>;
};

export async function createLocalScriptExecutionRoot(
  prefix = 'experiment-foundation-capability-',
): Promise<LocalScriptExecutionRoot> {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  return {
    root,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export async function writeAllowedLocalScript(
  root: string,
  fileName = 'allowed-local-script.mjs',
): Promise<string> {
  const scriptPath = path.resolve(root, fileName);
  if (scriptPath !== root && !scriptPath.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error('LocalScript fixture path must stay under the execution root.');
  }
  await writeFile(scriptPath, 'console.log("experiment-foundation-capability-ok");\n', 'utf8');
  await chmod(scriptPath, 0o755);
  return scriptPath;
}

export function installLocalScriptTestEnv(root: string): () => void {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    executionRoot: process.env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ROOT,
    executionEnabled: process.env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ENABLED,
    allowedCommands: process.env.EXPERIMENT_FOUNDATION_LOCAL_SCRIPT_ALLOWED_COMMANDS,
  };
  process.env.NODE_ENV = 'test';
  process.env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ROOT = root;
  process.env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ENABLED = 'true';
  process.env.EXPERIMENT_FOUNDATION_LOCAL_SCRIPT_ALLOWED_COMMANDS = [
    process.execPath,
    path.basename(process.execPath),
    'node',
  ].join(',');

  return () => {
    restoreOptionalEnv('NODE_ENV', previous.nodeEnv);
    restoreOptionalEnv('EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ROOT', previous.executionRoot);
    restoreOptionalEnv('EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ENABLED', previous.executionEnabled);
    restoreOptionalEnv('EXPERIMENT_FOUNDATION_LOCAL_SCRIPT_ALLOWED_COMMANDS', previous.allowedCommands);
  };
}

function restoreOptionalEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
