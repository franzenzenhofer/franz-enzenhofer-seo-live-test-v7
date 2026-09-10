import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A dns-prefetch hint asks the browser to look up a hostname early. The listed URLs are hints, not proof of faster loading. No hints can be appropriate when the page has no useful third-party connections to prepare.",
      action: "Add hints only for hostnames the page is likely to use, and measure whether they help. Remove stale hints when the corresponding service is no longer used.",
    },
    provenance: 'standard',
    references: ['https://html.spec.whatwg.org/multipage/links.html#link-type-dns-prefetch'],
    description: 'Info-only count of <link rel="dns-prefetch"> elements with their target hrefs.',
  },
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
      priority: n ? 750 : 900,
      name: 'rel=dns-prefetch',
      details: {
        ...(n ? { sourceHtml, snippet: extractSnippet(sourceHtml) } : {}),
        urls: Array.from(links, (el) => el.getAttribute('href') || '').filter(Boolean),
        count: n,
        shown: evidence.shown,
        truncated: evidence.truncated,
        domPaths,
        tested: 'Queried <link rel="dns-prefetch">',
      },
    }
  },
}
