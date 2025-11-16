import type { Rule } from '@/core/types'

const enc = (h?: Record<string, string>) => (h?.['content-encoding'] || '').toLowerCase()

export const gzipRule: Rule = {
  id: 'http:gzip',
  name: 'Gzip/Brotli',
  enabled: true,
  what: 'http',
  async run(page) {
    const e = enc(page.headers)
    const ok = e.includes('br') || e.includes('gzip')
    if (!e)
      return {
        label: 'HTTP',
        message: 'No content-encoding header',
        type: 'warn',
        name: 'Gzip/Brotli',
        details: { httpHeaders: page.headers || {} },
      }
    return {
      label: 'HTTP',
      message: ok ? `Compressed (${e})` : `Not compressed (${e})`,
      type: ok ? 'ok' : 'warn',
      name: 'Gzip/Brotli',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

