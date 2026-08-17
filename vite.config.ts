import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { chunkNameForModuleId } from './src/build/chunking'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  build: {
    // Three.js is isolated in its own cacheable engine chunk; keep a tight budget for regressions.
    chunkSizeWarningLimit: 560,
    rollupOptions: {
      output: {
        manualChunks: chunkNameForModuleId,
      },
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: /^three$/, replacement: path.resolve(__dirname, './node_modules/three/src/Three.js') },
    ],
  },
});
