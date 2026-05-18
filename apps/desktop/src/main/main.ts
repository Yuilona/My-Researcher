import { app, BrowserWindow, dialog, ipcMain, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OpenDialogOptions } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const shouldOpenDevTools = process.env.DESKTOP_OPEN_DEVTOOLS === '1';
const preloadCandidates = [
  path.join(__dirname, 'preload.cjs'),
  path.resolve(__dirname, '../../src/main/preload.cjs'),
  path.join(__dirname, 'preload.js'),
];
const preloadPath = preloadCandidates.find((candidate) => fs.existsSync(candidate)) ?? preloadCandidates[0];
const backendBaseUrl = process.env.DESKTOP_BACKEND_BASE_URL ?? 'http://127.0.0.1:3000';
const allowedGovernanceMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const allowedGovernancePathPrefixes = [
  '/paper-projects/',
  '/experiment-foundation/',
  '/literature/',
  '/settings/literature-content-processing/',
  '/topics/',
  '/auto-pull/',
  '/title-cards/',
] as const;
const allowedGovernanceExactPaths = new Set([
  '/settings/literature-content-processing',
  '/title-cards',
]);
const responseMessagePreviewMaxLength = 240;
const isMacOS = process.platform === 'darwin';
let mainWindow: BrowserWindow | null = null;

type GovernanceBridgeRequest = {
  method: string;
  path: string;
  body?: unknown;
};

type GovernanceBridgeResponse = {
  ok: boolean;
  status: number;
  payload: unknown;
};

type SelectDirectoryRequest = {
  title?: string;
  defaultPath?: string;
};

type LocalSecretsRecord = {
  openaiApiKey?: {
    encryptedValue: string;
    updatedAt: string;
  };
};

type LiteratureLocalSecretsStatus = {
  openai_api_key_set: boolean;
  updated_at: string | null;
  storage: 'encrypted-file' | 'unavailable';
  error?: string;
};

type SetLiteratureOpenAIKeyRequest = {
  apiKey?: string | null;
};

type SyncLiteratureLocalSecretsResponse = {
  synced: boolean;
  status: LiteratureLocalSecretsStatus;
};

function focusAndCenterWindow(window: BrowserWindow) {
  if (window.isMinimized()) {
    window.restore();
  }
  app.focus({ steal: true });
  window.center();
  window.show();
  window.moveTop();
  window.focus();
  window.webContents.focus();
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    center: true,
    show: false,
    backgroundColor: isMacOS ? '#00000000' : '#f3f5f8',
    transparent: isMacOS,
    autoHideMenuBar: true,
    ...(isMacOS
      ? {
          titleBarStyle: 'hidden' as const,
          trafficLightPosition: { x: 16, y: 15 },
          vibrancy: 'under-window' as const,
          visualEffectState: 'active' as const,
          title: '',
        }
      : {}),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
    if (shouldOpenDevTools) {
      window.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    const rendererHtml = path.join(__dirname, '../renderer/index.html');
    void window.loadFile(rendererHtml);
  }

  window.once('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  // Keep native title text hidden so the chrome is toolbar-only.
  window.on('page-title-updated', (event) => {
    event.preventDefault();
    window.setTitle('');
  });

  return window;
}

function normalizeGovernancePath(input: string): string {
  const isAllowedPrefix = allowedGovernancePathPrefixes.some((prefix) => input.startsWith(prefix));
  const isAllowedExactPath = allowedGovernanceExactPaths.has(input);

  if (!isAllowedPrefix && !isAllowedExactPath) {
    throw new Error('Unsupported governance path.');
  }

  return input;
}

function looksLikeHtmlResponse(value: string): boolean {
  return /<(?:!doctype|html|head|body|script|div)\b/i.test(value.trim().slice(0, 512));
}

function compactResponseMessage(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildUnexpectedResponsePayload(status: number, contentType: string, body: string): unknown {
  const contentTypeLabel = contentType.trim() ? `，Content-Type: ${contentType.trim()}` : '';
  const preview = compactResponseMessage(body).slice(0, responseMessagePreviewMaxLength);
  const previewSuffix = preview && !looksLikeHtmlResponse(body) ? ` 响应摘要：${preview}` : '';

  return {
    error: {
      code: 'API_RESPONSE_FORMAT',
      message: [
        `API 服务返回了非 JSON 响应（HTTP ${status}${contentTypeLabel}）。`,
        `请确认后端服务已启动，且 DESKTOP_BACKEND_BASE_URL=${backendBaseUrl} 指向本项目 Fastify 后端。`,
        previewSuffix,
      ].join(''),
    },
  };
}

function localSecretsFilePath(): string {
  return path.join(app.getPath('userData'), 'literature-content-processing-secrets.json');
}

async function readLocalSecrets(): Promise<LocalSecretsRecord> {
  try {
    const raw = await fs.promises.readFile(localSecretsFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as LocalSecretsRecord;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeLocalSecrets(record: LocalSecretsRecord): Promise<void> {
  const filePath = localSecretsFilePath();
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await fs.promises.chmod(filePath, 0o600);
}

async function getLiteratureLocalSecretsStatus(): Promise<LiteratureLocalSecretsStatus> {
  if (!safeStorage.isEncryptionAvailable()) {
    return {
      openai_api_key_set: false,
      updated_at: null,
      storage: 'unavailable',
      error: 'Local encrypted storage is not available on this system.',
    };
  }

  const record = await readLocalSecrets();
  return {
    openai_api_key_set: Boolean(record.openaiApiKey?.encryptedValue),
    updated_at: record.openaiApiKey?.updatedAt ?? null,
    storage: 'encrypted-file',
  };
}

async function setLiteratureLocalOpenAIKey(apiKey: string | null): Promise<LiteratureLocalSecretsStatus> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Local encrypted storage is not available on this system.');
  }

  const record = await readLocalSecrets();
  if (apiKey === null) {
    delete record.openaiApiKey;
  } else {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      throw new Error('OpenAI API key cannot be blank.');
    }
    record.openaiApiKey = {
      encryptedValue: safeStorage.encryptString(trimmed).toString('base64'),
      updatedAt: new Date().toISOString(),
    };
  }

  await writeLocalSecrets(record);
  return getLiteratureLocalSecretsStatus();
}

async function readLiteratureLocalOpenAIKey(): Promise<string | null> {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }
  const record = await readLocalSecrets();
  const encryptedValue = record.openaiApiKey?.encryptedValue;
  if (!encryptedValue) {
    return null;
  }
  return safeStorage.decryptString(Buffer.from(encryptedValue, 'base64'));
}

function normalizeSetLiteratureOpenAIKeyRequest(request?: SetLiteratureOpenAIKeyRequest): string | null {
  if (!request || !Object.prototype.hasOwnProperty.call(request, 'apiKey')) {
    throw new Error('apiKey must be provided as a string or null.');
  }
  if (request.apiKey === null) {
    return null;
  }
  if (typeof request.apiKey === 'string') {
    return request.apiKey;
  }
  throw new Error('apiKey must be provided as a string or null.');
}

async function syncLiteratureLocalSecretsToBackend(): Promise<SyncLiteratureLocalSecretsResponse> {
  const apiKey = await readLiteratureLocalOpenAIKey();
  const status = await getLiteratureLocalSecretsStatus();
  if (!apiKey) {
    return { synced: false, status };
  }

  const response = await fetch(new URL('/settings/literature-content-processing', backendBaseUrl), {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      providers: [{ provider: 'openai', api_key: apiKey }],
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };
    throw new Error(readBackendErrorMessage(payload, response.status));
  }

  return { synced: true, status };
}

function readBackendErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: { code?: unknown; message?: unknown } }).error;
    const code = typeof error?.code === 'string' ? error.code : null;
    const message = typeof error?.message === 'string' ? error.message : null;
    if (code && message) {
      return `${code}: ${message}`;
    }
    if (message) {
      return message;
    }
  }
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return `Request failed with status ${status}.`;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

ipcMain.handle('desktop:get-app-meta', () => ({
  appName: 'Morethan Research Desktop',
  appVersion: app.getVersion(),
  platform: process.platform,
}));

ipcMain.handle('desktop:select-directory', async (event, request?: SelectDirectoryRequest): Promise<string | null> => {
  const owner = BrowserWindow.fromWebContents(event.sender) ?? mainWindow ?? undefined;
  const defaultPath = typeof request?.defaultPath === 'string' && request.defaultPath.trim()
    ? request.defaultPath.trim()
    : undefined;
  const title = typeof request?.title === 'string' && request.title.trim()
    ? request.title.trim()
    : '选择目录';
  const options: OpenDialogOptions = {
    title,
    defaultPath,
    properties: ['openDirectory', 'createDirectory'],
  };
  const result = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled) {
    return null;
  }
  return result.filePaths[0] ?? null;
});

ipcMain.handle('desktop:get-literature-content-processing-local-secrets', async () =>
  getLiteratureLocalSecretsStatus(),
);

ipcMain.handle(
  'desktop:set-literature-content-processing-local-openai-key',
  async (_event, request?: SetLiteratureOpenAIKeyRequest) =>
    setLiteratureLocalOpenAIKey(normalizeSetLiteratureOpenAIKeyRequest(request)),
);

ipcMain.handle('desktop:sync-literature-content-processing-local-secrets', async () =>
  syncLiteratureLocalSecretsToBackend(),
);

ipcMain.handle(
  'desktop:governance-request',
  async (_event, request: GovernanceBridgeRequest): Promise<GovernanceBridgeResponse> => {
    const method = String(request.method ?? '').toUpperCase();
    const targetPath = normalizeGovernancePath(request.path);

    if (!allowedGovernanceMethods.has(method)) {
      return {
        ok: false,
        status: 405,
        payload: {
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Unsupported method ${method}.`,
          },
        },
      };
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const init: RequestInit = { method, headers };

    if (request.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(request.body);
    }

    try {
      const response = await fetch(new URL(targetPath, backendBaseUrl), init);
      const contentType = response.headers.get('content-type') ?? '';

      if (!contentType.includes('application/json')) {
        const body = await response.text();
        return {
          ok: false,
          status: response.status,
          payload: buildUnexpectedResponsePayload(response.status, contentType, body),
        };
      }

      const payload = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        payload,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Desktop governance request failed.';
      return {
        ok: false,
        status: 500,
        payload: {
          error: {
            code: 'DESKTOP_PROXY_ERROR',
            message,
          },
        },
      };
    }
  },
);

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = createWindow();
    }

    focusAndCenterWindow(mainWindow);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
