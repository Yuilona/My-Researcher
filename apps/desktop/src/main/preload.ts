import { contextBridge, ipcRenderer } from 'electron';

type DesktopMeta = {
  appName: string;
  appVersion: string;
  platform: NodeJS.Platform;
};

type GovernanceBridgeRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

const desktopApi = {
  getAppMeta: (): Promise<DesktopMeta> => ipcRenderer.invoke('desktop:get-app-meta') as Promise<DesktopMeta>,
  selectDirectory: (request?: SelectDirectoryRequest): Promise<string | null> =>
    ipcRenderer.invoke('desktop:select-directory', request) as Promise<string | null>,
  getLiteratureContentProcessingLocalSecrets: (): Promise<LiteratureLocalSecretsStatus> =>
    ipcRenderer.invoke('desktop:get-literature-content-processing-local-secrets') as Promise<LiteratureLocalSecretsStatus>,
  setLiteratureContentProcessingLocalOpenAIKey: (
    request?: SetLiteratureOpenAIKeyRequest,
  ): Promise<LiteratureLocalSecretsStatus> =>
    ipcRenderer.invoke('desktop:set-literature-content-processing-local-openai-key', request) as Promise<LiteratureLocalSecretsStatus>,
  syncLiteratureContentProcessingLocalSecrets: (): Promise<SyncLiteratureLocalSecretsResponse> =>
    ipcRenderer.invoke('desktop:sync-literature-content-processing-local-secrets') as Promise<SyncLiteratureLocalSecretsResponse>,
  requestGovernance: (
    request: GovernanceBridgeRequest,
  ): Promise<GovernanceBridgeResponse> =>
    ipcRenderer.invoke('desktop:governance-request', request) as Promise<GovernanceBridgeResponse>,
};

contextBridge.exposeInMainWorld('desktopApi', desktopApi);
