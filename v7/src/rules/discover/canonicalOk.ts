import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls#canonicalization'

export const discoverCanonicalOkRule: Rule = {
  id: 'discover:canonical-ok',
  name: 'Canonical present + absolute',
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.querySelector('link[rel="canonical"]')
    if (!el) {
      return {
        label: 'DISCOVER',
        message: 'Missing canonical link in <head>',
        type: 'warn',
        name: 'canonicalOk',
        details: { reference: SPEC },
      }
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
            name: 'Canonical present + absolute',
            details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), canonicalUrl: abs, reference: SPEC },
          }
        : {
            label: 'DISCOVER',
            message: 'Canonical URL not absolute (relative)',
            type: 'warn',
            name: 'Canonical present + absolute',
            details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), canonicalUrl: href, reference: SPEC },
          }
    } catch {
      return {
        label: 'DISCOVER',
        message: 'Invalid canonical URL',
        type: 'warn',
        name: 'Canonical present + absolute',
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), reference: SPEC },
      }
    }
  },
}
