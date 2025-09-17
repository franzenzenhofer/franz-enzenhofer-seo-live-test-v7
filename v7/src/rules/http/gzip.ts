import type { Rule } from '@/core/types'

const enc = (h?: Record<string, string>) => (h?.['content-encoding'] || '').toLowerCase()

export const gzipRule: Rule = {
  id: 'http:gzip',
  name: 'Gzip/Brotli',
  enabled: true,
  async run(page) {
    const e = enc(page.headers)
    if (!e) return { label: 'HTTP', message: 'No content-encoding header', type: 'warn' }
    const ok = e.includes('br') || e.includes('gzip')
    return ok ? { label: 'HTTP', message: `Compressed (${e})`, type: 'ok' } : { label: 'HTTP', message: `Not compressed (${e})`, type: 'warn' }
  },
}

