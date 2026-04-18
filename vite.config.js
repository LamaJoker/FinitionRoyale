import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // La racine = dossier src/ pour le dev server
  root: resolve(__dirname, 'src'),

  // Dossier public (assets copiés tels quels)
  publicDir: resolve(__dirname, 'public'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        // Page principale uniquement (les villes sont générées séparément)
        main: resolve(__dirname, 'src/pages/index.html'),
      },
    },

    // Hasher les noms de fichiers pour le cache busting
    assetsDir: 'assets',
    cssMinify: true,
    minify: 'esbuild',
    target: 'es2018',
    reportCompressedSize: true,

    // Code splitting désactivé (bundle unique pour performance)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
      },
      output: {
        // Nommage des assets avec hash pour cache busting
        assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },

  // Alias pour importer depuis src/
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 3000,
    open: true,
    // Proxy API calls vers PHP local si besoin
    proxy: {
      '/send-rdv.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  css: {
    devSourcemap: true,
  },
});
