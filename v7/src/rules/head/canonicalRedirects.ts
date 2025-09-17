import type { Rule } from '@/core/types'

export const canonicalRedirectsRule: Rule = {
  id: 'head:canonical-redirects',
  name: 'Canonical Redirects',
  enabled: true,
  async run(page) {
    const href = page.doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
    if (!href) return { label: 'HEAD', message: 'No canonical link found.', type: 'error' }
    try {
      const r = await fetch(href, { method: 'HEAD', redirect: 'manual' })
      const loc = r.headers.get('location')
      const is3xx = r.status >= 300 && r.status < 400
      return is3xx
        ? { label: 'HEAD', message: `Canonical redirects to ${loc || '(no location)'}`, type: 'warn' }
        : { label: 'HEAD', message: 'Canonical does not redirect', type: 'ok' }
    } catch (e) {
      return { label: 'HEAD', message: `Canonical check failed: ${String(e)}`, type: 'warn' }
    }
  },
}

