import { defineConfig } from 'vitest/config'
import { resolve as r } from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Concurrency tuning for faster local feedback
    pool: 'threads',
    poolOptions: { threads: { minThreads: 4, maxThreads: 8 } },
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: { provider: 'v8' },
  },
  resolve: { alias: { '@': r(__dirname, 'src') } },
})
