import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  enabled: true,
  what: 'static',
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="dns-prefetch"]')
    const n = links.length
    const sourceHtml = n ? extractHtmlFromList(links) : ''
    return {
      label: 'SPEED',
      message: n ? `dns-prefetch links: ${n}` : 'No dns-prefetch links',
      type: 'info',
      name: 'dnsPrefetch',
      details: n
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
          }
        : undefined,
    }
  },
}

