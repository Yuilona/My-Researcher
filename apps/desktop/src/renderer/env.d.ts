export {};

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

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_GOVERNANCE_PANELS?: string;
  /**
   * T-087 reviewer workbench feature flag — **retired in Phase 6**. Kept in
   * the typed env surface so externally-set `.env` values don't break the
   * `import.meta.env` shape, but the value is no longer read by the app:
   * the reviewer workbench is now always-on and the legacy
   * `TitleCardManagementModule` was deleted.
   */
  readonly VITE_TOPIC_WORKBENCH_V1ABC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    desktopApi?: {
      getAppMeta: () => Promise<{
        appName: string;
        appVersion: string;
        platform: NodeJS.Platform;
      }>;
      selectDirectory: (request?: SelectDirectoryRequest) => Promise<string | null>;
      getLiteratureContentProcessingLocalSecrets: () => Promise<LiteratureLocalSecretsStatus>;
      setLiteratureContentProcessingLocalOpenAIKey: (
        request?: SetLiteratureOpenAIKeyRequest,
      ) => Promise<LiteratureLocalSecretsStatus>;
      syncLiteratureContentProcessingLocalSecrets: () => Promise<SyncLiteratureLocalSecretsResponse>;
      requestGovernance: (
        request: GovernanceBridgeRequest,
      ) => Promise<GovernanceBridgeResponse>;
    };
  }
}
