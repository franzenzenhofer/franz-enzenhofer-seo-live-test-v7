import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

export const preconnectRule: Rule = {
  id: 'speed:preconnect',
  name: 'rel=preconnect',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A preconnect hint asks the browser to prepare a connection to an origin before a resource needs it. This lists declared hints; it does not prove that a connection was opened or that the hint improved loading.",
      action: "Use preconnect for a small number of important origins needed early. Remove unused hints and configure crossorigin where required by the actual resource request; verify the effect in network timing.",
    },
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/links.html#link-type-preconnect',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect',
    ],
    description: 'Info-only count of <link rel="preconnect"> elements with their hrefs.',
  },
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="preconnect"]')
    const n = links.length
    const evidence = sampleElements(links)
    const sourceHtml = n ? extractHtmlFromList(evidence.sample) : ''
    const domPaths = n ? getDomPaths(evidence.sample) : []
    return {
      label: 'SPEED',
      message: n ? `preconnect links: ${n}` : 'No preconnect links',
      type: 'info',
      priority: n ? 750 : 900,
      name: 'rel=preconnect',
      details: {
        ...(n ? { sourceHtml, snippet: extractSnippet(sourceHtml) } : {}),
        urls: Array.from(links, (el) => el.getAttribute('href') || '').filter(Boolean),
        count: n,
        shown: evidence.shown,
        truncated: evidence.truncated,
        domPaths,
        tested: 'Queried <link rel="preconnect">',
      },
    }
  },
}
