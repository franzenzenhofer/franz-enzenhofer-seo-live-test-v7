import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const discoverCanonicalOkRule: Rule = {
  id: 'discover:canonical-ok',
  name: 'Canonical present + absolute',
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.querySelector('link[rel="canonical"]')
    if (!el) {
      return { label: 'DISCOVER', message: 'Missing canonical link in <head>', type: 'warn', name: 'canonicalOk' }
    }

    const href = el.getAttribute('href') || ''
    const sourceHtml = extractHtml(el)

    try {
      const abs = new URL(href, page.url).toString()
      const isAbsolute = abs.startsWith('http')

      return isAbsolute
        ? {
            label: 'DISCOVER',
            message: 'Canonical link present (absolute URL)',
            type: 'ok',
            name: 'canonicalOk',
            details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), canonicalUrl: abs },
          }
        : {
            label: 'DISCOVER',
            message: 'Canonical URL not absolute (relative)',
            type: 'warn',
            name: 'canonicalOk',
            details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), canonicalUrl: href },
          }
    } catch {
      return {
        label: 'DISCOVER',
        message: 'Invalid canonical URL',
        type: 'warn',
        name: 'canonicalOk',
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
      }
    }
  },
}

