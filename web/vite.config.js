import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@zumbo/shared': fileURLToPath(new URL('../shared/src/index.js', import.meta.url)) } },
  server: { fs: { allow: ['..'] }, host: true },
  build: { target: 'es2022', sourcemap: true },
});
