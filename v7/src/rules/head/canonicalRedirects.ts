import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const canonicalRedirectsRule: Rule = {
  id: 'head:canonical-redirects',
  name: 'Canonical Redirects',
  enabled: true,
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel="canonical"]')
    const href = linkEl?.getAttribute('href')
    if (!href)
      return { name: 'Canonical Redirects', label: 'HEAD', message: 'No canonical link found.', type: 'error' }
    const sourceHtml = linkEl ? extractHtml(linkEl) : ''
    try {
      const r = await fetch(href, { method: 'HEAD', redirect: 'manual' })
      const loc = r.headers.get('location')
      const is3xx = r.status >= 300 && r.status < 400
      return {
        name: 'Canonical Redirects',
        label: 'HEAD',
        message: is3xx ? `Canonical redirects to ${loc || '(no location)'}` : 'Canonical does not redirect',
        type: is3xx ? 'warn' : 'ok',
        details: linkEl
          ? {
              sourceHtml,
              snippet: extractSnippet(sourceHtml),
              domPath: getDomPath(linkEl),
            }
          : undefined,
      }
    } catch (e) {
      return {
        name: 'Canonical Redirects',
        label: 'HEAD',
        message: `Canonical check failed: ${String(e)}`,
        type: 'warn',
        details: linkEl
          ? {
              sourceHtml,
              snippet: extractSnippet(sourceHtml),
              domPath: getDomPath(linkEl),
            }
          : undefined,
      }
    }
  },
}

