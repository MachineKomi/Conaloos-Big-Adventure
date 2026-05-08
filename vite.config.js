import { defineConfig } from 'vite';
import { manifestPlugin } from './src/plugins/manifestPlugin.js';

// Base path can be overridden for GitHub Pages deploys.
//   BASE_PATH=/conaloos/ npm run build
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [manifestPlugin()],
  publicDir: 'assets',
  server: {
    port: 5173,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 1024
  }
});
