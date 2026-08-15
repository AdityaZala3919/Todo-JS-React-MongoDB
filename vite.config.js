import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vercelApiPlugin } from './vite-plugin-vercel-api.js';

export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

