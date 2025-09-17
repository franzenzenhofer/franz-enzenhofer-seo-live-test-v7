import type { Rule } from '@/core/types'

export const robotsNoindexRule: Rule = {
  id: 'head:robots-noindex',
  name: 'Meta robots noindex',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[name="robots"]')
    if (!m) return { label: 'HEAD', message: 'No robots meta', type: 'info' }
    const c = (m.getAttribute('content') || '').toLowerCase()
    const noindex = /\bnoindex\b/.test(c)
    return noindex ? { label: 'HEAD', message: 'robots: noindex', type: 'warn' } : { label: 'HEAD', message: 'robots: indexable', type: 'ok' }
  },
}

