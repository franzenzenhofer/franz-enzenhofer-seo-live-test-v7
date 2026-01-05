import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/Performance/dns-prefetch'

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  enabled: true,
  what: 'static',
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="dns-prefetch"]')
    const n = links.length
    const sourceHtml = n ? extractHtmlFromList(links) : ''
    const domPaths = n ? getDomPaths(Array.from(links)) : []
    return {
      label: 'SPEED',
      message: n ? `dns-prefetch links: ${n}` : 'No dns-prefetch links',
      type: 'info',
      name: 'rel=dns-prefetch',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        count: n,
        domPaths,
        tested: 'Queried <link rel="dns-prefetch">',
        reference: SPEC,
      },
    }
  },
}
