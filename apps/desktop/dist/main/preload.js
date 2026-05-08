import { contextBridge, ipcRenderer } from 'electron';
const desktopApi = {
    getAppMeta: () => ipcRenderer.invoke('desktop:get-app-meta'),
    selectDirectory: (request) => ipcRenderer.invoke('desktop:select-directory', request),
    getLiteratureContentProcessingLocalSecrets: () => ipcRenderer.invoke('desktop:get-literature-content-processing-local-secrets'),
    setLiteratureContentProcessingLocalOpenAIKey: (request) => ipcRenderer.invoke('desktop:set-literature-content-processing-local-openai-key', request),
    syncLiteratureContentProcessingLocalSecrets: () => ipcRenderer.invoke('desktop:sync-literature-content-processing-local-secrets'),
    requestGovernance: (request) => ipcRenderer.invoke('desktop:governance-request', request),
};
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
//# sourceMappingURL=preload.js.map