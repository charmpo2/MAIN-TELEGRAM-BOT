import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
})
