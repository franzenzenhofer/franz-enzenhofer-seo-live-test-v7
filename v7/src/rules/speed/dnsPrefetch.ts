import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/Performance/dns-prefetch'

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  enabled: true,
  what: 'static',
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="dns-prefetch"]')
    const n = links.length
    const evidence = sampleElements(links)
    const sourceHtml = n ? extractHtmlFromList(evidence.sample) : ''
    const domPaths = n ? getDomPaths(evidence.sample) : []
    return {
      label: 'SPEED',
      message: n ? `dns-prefetch links: ${n}` : 'No dns-prefetch links',
      type: 'info',
      name: 'rel=dns-prefetch',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        count: n,
        shown: evidence.shown,
        truncated: evidence.truncated,
        domPaths,
        tested: 'Queried <link rel="dns-prefetch">',
        reference: SPEC,
      },
    }
  },
}
