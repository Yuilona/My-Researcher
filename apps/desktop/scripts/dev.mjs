#!/usr/bin/env node

import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const envFilePath = path.join(repoRoot, '.env.local');
const DEFAULT_BASE_PORT = 5173;
const DEFAULT_BACKEND_BASE_PORT = 3310;
const MAX_PORT_ATTEMPTS = 30;
const RENDERER_STARTUP_GRACE_MS = 1_200;
const DEV_HOST = '127.0.0.1';

function parsePort(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isPortOpen(port, host = DEV_HOST) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function waitForPortReady(port, timeoutMs = 30_000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection({ host: DEV_HOST, port });

      socket.once('connect', () => {
        socket.end();
        resolve();
      });

      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for renderer on port ${port}.`));
          return;
        }
        setTimeout(tryConnect, 200);
      });
    };

    tryConnect();
  });
}

async function isBackendHealthy(baseUrl) {
  try {
    const response = await fetch(new URL('/health', baseUrl), {
      headers: {
        Accept: 'application/json',
      },
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('application/json')) {
      return false;
    }

    const payload = await response.json();
    return payload?.ok === true;
  } catch {
    return false;
  }
}

async function waitForBackendReady(baseUrl, backend, timeoutMs = 45_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (backend.exitCode !== null || backend.signalCode !== null) {
      throw new Error(
        `backend exited during startup (code=${backend.exitCode ?? 'null'}, signal=${backend.signalCode ?? 'null'})`,
      );
    }

    if (await isBackendHealthy(baseUrl)) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for backend on ${baseUrl}.`);
}

function waitForStableStartup(renderer, graceMs = RENDERER_STARTUP_GRACE_MS) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`renderer exited during startup (${code ?? 1})`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      renderer.off('error', onError);
      renderer.off('exit', onExit);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, graceMs);

    renderer.once('error', onError);
    renderer.once('exit', onExit);
  });
}

function terminateProcess(child, signal = 'SIGTERM') {
  if (!child || child.killed) {
    return;
  }

  child.kill(signal);
}

async function resolveBackend() {
  const configuredBaseUrl = process.env.DESKTOP_BACKEND_BASE_URL ?? process.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    return {
      backend: null,
      baseUrl: configuredBaseUrl,
      managed: false,
    };
  }

  const defaultBaseUrl = 'http://127.0.0.1:3000';
  if (await isBackendHealthy(defaultBaseUrl)) {
    return {
      backend: null,
      baseUrl: defaultBaseUrl,
      managed: false,
    };
  }

  const basePort = parsePort(process.env.DESKTOP_BACKEND_PORT, DEFAULT_BACKEND_BASE_PORT);
  const envFileValues = readDotEnvFile(envFilePath);

  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = basePort + offset;
    const baseUrl = `http://${DEV_HOST}:${port}`;

    if (await isBackendHealthy(baseUrl)) {
      return {
        backend: null,
        baseUrl,
        managed: false,
      };
    }

    if (await isPortOpen(port)) {
      continue;
    }

    const backend = spawn(
      'pnpm',
      [
        '--dir',
        repoRoot,
        '--filter',
        '@paper-engineering-assistant/backend',
        'exec',
        'node',
        '--enable-source-maps',
        '--loader',
        'ts-node/esm',
        'src/server.ts',
      ],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env: {
          ...envFileValues,
          ...process.env,
          HOST: DEV_HOST,
          PORT: String(port),
        },
      },
    );

    await waitForBackendReady(baseUrl, backend);
    console.log(`[desktop-dev] Backend ready on ${baseUrl}.`);

    return {
      backend,
      baseUrl,
      managed: true,
    };
  }

  throw new Error(`Failed to find an available backend port from ${basePort}.`);
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
    });

    child.once('error', (error) => {
      reject(error);
    });

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed (code=${code ?? 'null'}, signal=${signal ?? 'null'})`));
    });
  });
}

function startRenderer(port, env = process.env) {
  return spawn('pnpm', ['exec', 'vite', '--host', DEV_HOST, '--port', String(port), '--strictPort'], {
    stdio: 'inherit',
    env,
  });
}

async function startRendererWithRetry(basePort, env, maxAttempts = MAX_PORT_ATTEMPTS) {
  let lastError = null;

  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = basePort + offset;
    const renderer = startRenderer(port, env);

    try {
      // Startup grace avoids false positives where another process owns the port.
      // eslint-disable-next-line no-await-in-loop
      await waitForStableStartup(renderer);
      // eslint-disable-next-line no-await-in-loop
      await waitForPortReady(port);

      if (port !== basePort) {
        console.log(`[desktop-dev] Port ${basePort} in use, switched to ${port}.`);
      }

      return { renderer, port };
    } catch (error) {
      lastError = error;
      terminateProcess(renderer);

      if (offset < maxAttempts - 1) {
        console.warn(`[desktop-dev] Renderer failed on port ${port}; retrying ${port + 1}.`);
        // eslint-disable-next-line no-await-in-loop
        await delay(150);
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
  throw new Error(
    `Failed to start renderer after ${maxAttempts} attempts from ${basePort}. Last error: ${reason}`,
  );
}

async function main() {
  const backendRuntime = await resolveBackend();
  const basePort = parsePort(process.env.DESKTOP_DEV_PORT, DEFAULT_BASE_PORT);
  const rendererEnv = {
    ...process.env,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? backendRuntime.baseUrl,
  };
  const { renderer, port } = await startRendererWithRetry(basePort, rendererEnv);

  let electron = null;
  let backend = backendRuntime.backend;
  let shuttingDown = false;

  const shutdownAll = (exitCode = 0) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    terminateProcess(electron);
    terminateProcess(renderer);
    if (backendRuntime.managed) {
      terminateProcess(backend);
    }

    setTimeout(() => {
      terminateProcess(electron, 'SIGKILL');
      terminateProcess(renderer, 'SIGKILL');
      if (backendRuntime.managed) {
        terminateProcess(backend, 'SIGKILL');
      }
      process.exit(exitCode);
    }, 500);
  };

  process.on('SIGINT', () => shutdownAll(130));
  process.on('SIGTERM', () => shutdownAll(143));

  renderer.once('exit', (code) => {
    if (shuttingDown) {
      return;
    }
    console.error(`[desktop-dev] renderer exited (${code ?? 1}).`);
    shutdownAll(code ?? 1);
  });

  if (backend) {
    backend.once('exit', (code) => {
      if (shuttingDown) {
        return;
      }
      console.error(`[desktop-dev] backend exited (${code ?? 1}).`);
      shutdownAll(code ?? 1);
    });
  }

  await waitForPortReady(port);
  console.log('[desktop-dev] Building main/preload...');
  await runCommand('pnpm', ['exec', 'tsc', '-p', 'tsconfig.main.json']);

  const electronEnv = {
    ...process.env,
    DESKTOP_BACKEND_BASE_URL: process.env.DESKTOP_BACKEND_BASE_URL ?? backendRuntime.baseUrl,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? backendRuntime.baseUrl,
    VITE_DEV_SERVER_URL: `http://${DEV_HOST}:${port}`,
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;

  electron = spawn('pnpm', ['exec', 'electron', 'dist/main/main.js'], {
    stdio: 'inherit',
    env: electronEnv,
  });

  electron.once('exit', (code) => {
    if (shuttingDown) {
      return;
    }
    console.log(`[desktop-dev] electron exited (${code ?? 0}).`);
    shutdownAll(code ?? 0);
  });
}

main().catch((error) => {
  console.error(`[desktop-dev] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
