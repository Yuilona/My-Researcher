import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';

const rootDirUrl = new URL('../', import.meta.url);
const srcDirUrl = new URL('../src/', import.meta.url);
const rootDir = fileURLToPath(rootDirUrl);
const srcDir = fileURLToPath(srcDirUrl);

const PRESERVE_REAL_ENV_FLAG = 'BACKEND_TEST_PRESERVE_REAL_ENV';
const REPOSITORY_STRATEGY_ENV_KEYS = [
  'TITLE_CARD_REPOSITORY',
  'RESEARCH_LIFECYCLE_REPOSITORY',
  'AUTO_PULL_REPOSITORY',
  'APPLICATION_SETTINGS_REPOSITORY',
  'EXPERIMENT_FOUNDATION_REPOSITORY',
];
const PROVIDER_SECRET_ENV_KEYS = [
  'OPENAI_API_KEY',
  'DASHSCOPE_API_KEY',
  'DASHSCOPE_API_KEY_CODING',
  'DEEPSEEK_API_KEY',
];

const testFiles = await collectTestFiles(srcDir);
if (testFiles.length === 0) {
  console.error('No backend test files were found under src/.');
  process.exit(1);
}

const args = ['--test', '--loader', 'ts-node/esm', ...testFiles];
const child = spawn(process.execPath, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env: buildTestEnv(),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

async function collectTestFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return collectTestFiles(entryPath);
      }
      if (!entry.name.endsWith('.test.ts')) {
        return [];
      }
      return [relative(rootDir, entryPath).replaceAll('\\', '/')];
    }),
  );

  return nested.flat().sort((left, right) => left.localeCompare(right));
}

function buildTestEnv() {
  const env = { ...process.env };

  if (env[PRESERVE_REAL_ENV_FLAG] === '1') {
    return env;
  }

  for (const key of REPOSITORY_STRATEGY_ENV_KEYS) {
    delete env[key];
  }
  for (const key of PROVIDER_SECRET_ENV_KEYS) {
    delete env[key];
  }

  env.AUTO_PULL_SCHEDULER_ENABLED = 'false';
  env.NODE_ENV = env.NODE_ENV || 'test';

  return env;
}
