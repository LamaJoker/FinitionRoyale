import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
      }
    },
    cssMinify: true,
    minify: 'esbuild',
    target: 'es2018',
    reportCompressedSize: true,
  },

  server: {
    port: 3000,
    open: true,
  },

  css: {
    devSourcemap: true,
  }
});
