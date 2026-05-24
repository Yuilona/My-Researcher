import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const rootDirUrl = new URL('../', import.meta.url);
const srcDirUrl = new URL('../src/', import.meta.url);
const rootDir = fileURLToPath(rootDirUrl);
const srcDir = fileURLToPath(srcDirUrl);
const repoRoot = resolve(rootDir, '../..');

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

await loadLocalEnvFiles([
  join(repoRoot, '.env.local'),
  join(repoRoot, '.env'),
  join(rootDir, '.env.local'),
  join(rootDir, '.env'),
]);

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

async function loadLocalEnvFiles(filePaths) {
  for (const filePath of filePaths) {
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed || process.env[parsed.key] !== undefined) {
        continue;
      }
      process.env[parsed.key] = parsed.value;
    }
  }
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const declaration = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
  const separatorIndex = declaration.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = declaration.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null;
  }

  return {
    key,
    value: parseEnvValue(declaration.slice(separatorIndex + 1).trim()),
  };
}

function parseEnvValue(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replaceAll('\\n', '\n')
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\');
  }

  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  return value;
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
