import type { Rule } from '@/core/types'

export const canonicalAbsoluteRule: Rule = {
  id: 'head:canonical-absolute',
  name: 'Canonical absolute URL',
  enabled: true,
  async run(page) {
    const href = page.doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    if (!href) return { label: 'HEAD', message: 'No canonical link', type: 'info' }
    try { new URL(href, page.url); return href.startsWith('http') ? { label: 'HEAD', message: 'Canonical absolute', type: 'ok' } : { label: 'HEAD', message: 'Canonical is relative', type: 'warn' } } catch { return { label: 'HEAD', message: 'Invalid canonical URL', type: 'warn' } }
  },
}
