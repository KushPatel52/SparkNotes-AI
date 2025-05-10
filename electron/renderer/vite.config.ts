import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  root: __dirname,
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
});