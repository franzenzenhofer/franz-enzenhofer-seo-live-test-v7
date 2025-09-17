import type { Rule } from '@/core/types'

export const discoverCanonicalOkRule: Rule = {
  id: 'discover:canonical-ok',
  name: 'Discover: Canonical present + absolute',
  enabled: true,
  async run(page) {
    const el = page.doc.querySelector('link[rel="canonical"]')
    if (!el) return { label: 'DISCOVER', message: 'No canonical link', type: 'warn' }
    const href = el.getAttribute('href') || ''
    try { const abs = new URL(href, page.url).toString(); return abs.startsWith('http') ? { label: 'DISCOVER', message: 'Canonical OK', type: 'ok' } : { label: 'DISCOVER', message: 'Canonical is not absolute', type: 'warn' } } catch { return { label: 'DISCOVER', message: 'Invalid canonical URL', type: 'warn' } }
  },
}

