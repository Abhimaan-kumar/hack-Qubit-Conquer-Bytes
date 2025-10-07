import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
        tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content/content-main.jsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});