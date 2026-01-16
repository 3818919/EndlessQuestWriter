import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-modules',
      closeBundle() {
        // Copy the required JS modules to dist after build
        const dist = resolve(__dirname, 'dist');
        try {
          mkdirSync(dist, { recursive: true });
          copyFileSync(
            resolve(__dirname, 'src/eif-parser.js'),
            resolve(dist, 'eif-parser.js')
          );
          copyFileSync(
            resolve(__dirname, 'src/gfx-loader.js'),
            resolve(dist, 'gfx-loader.js')
          );
          copyFileSync(
            resolve(__dirname, 'src/character-animator.js'),
            resolve(dist, 'character-animator.js')
          );
        } catch (err) {
          console.error('Error copying modules:', err);
        }
      }
    }
  ],
  base: './',
  root: 'src/renderer',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  publicDir: false,
  server: {
    port: 5174,
    strictPort: false,
    fs: {
      allow: ['..', '../..']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
