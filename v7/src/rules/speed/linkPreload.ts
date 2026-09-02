import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

export const linkPreloadRule: Rule = {
  id: 'speed:link-preload',
  name: 'rel=preload links',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/links.html#link-type-preload',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload',
    ],
    description: 'Info-only count of <link rel="preload"> elements with their hrefs.',
  },
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="preload"]')
    const { sample, total: n, shown, truncated } = sampleElements(links)
    const sourceHtml = n ? extractHtmlFromList(sample) : ''
    const domPaths = n ? getDomPaths(sample) : []
    return {
      label: 'SPEED',
      message: n ? `preload links: ${n}` : 'No preload links',
      type: 'info',
      priority: n ? 750 : 900,
      name: 'rel=preload links',
      details: {
        ...(n ? { sourceHtml, snippet: extractSnippet(sourceHtml) } : {}),
        urls: Array.from(links, (el) => el.getAttribute('href') || '').filter(Boolean),
        count: n,
        shown,
        truncated,
        domPaths,
        tested: 'Queried <link rel="preload">',
      },
    }
  },
}
