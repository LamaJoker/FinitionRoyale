import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false, // pages villes générées séparément
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
      },
      output: {
        assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    cssMinify: true,
    minify: 'esbuild',
    target: 'es2018',
  },

  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },

  server: {
    port: 3000,
    open: true,
  },
});
