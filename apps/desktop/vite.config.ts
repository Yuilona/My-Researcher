import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const apiProxyTarget = process.env.VITE_API_BASE_URL ?? process.env.DESKTOP_BACKEND_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, './src/renderer'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/paper-projects': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/health': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
