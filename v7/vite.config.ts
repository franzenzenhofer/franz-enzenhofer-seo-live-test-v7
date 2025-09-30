import { fileURLToPath } from 'node:url'
import { dirname, resolve as r } from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'

import manifest from './src/manifest'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: { alias: { '@': r(root, 'src') } },
  build: {
    rollupOptions: {
      input: {
        offscreen: r(root, 'src/offscreen.html'),
        report: r(root, 'src/report.html'),
        settings: r(root, 'src/settings.html'),
        logs: r(root, 'src/logs.html'),
      },
    },
  },
})
