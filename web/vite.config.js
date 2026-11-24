import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: { alias: { '@zumbo/shared': r('../shared/src/index.js') } },
  server: { fs: { allow: ['..'] }, host: true },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { landing: r('./index.html'), jugar: r('./jugar/index.html') } },
  },
});
