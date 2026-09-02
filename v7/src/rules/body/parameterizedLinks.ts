import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleMatchingElements } from '@/shared/domEvidence'

// Hrefs are cheap strings: carry them all, bounded only by the phase-message
// byte budget (the bound is stated via hrefsTruncated).
const HREF_LIMIT = 500

export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links',
  name: 'Links with query params',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation',
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
    ],
    description: 'Counts anchors whose href contains a query string (?), reports the count and hrefs as info.',
  },
  async run(page) {
    const anchors = page.doc.querySelectorAll<HTMLAnchorElement>('a[href]')
    const paramLinks = sampleMatchingElements(
      anchors,
      (anchor) => (anchor.getAttribute('href') || '').includes('?'),
    )
    const hrefs: string[] = []
    for (let index = 0; index < anchors.length && hrefs.length < HREF_LIMIT; index++) {
      const href = anchors.item(index)?.getAttribute('href') || ''
      if (href.includes('?')) hrefs.push(href)
    }

    const sourceHtml = extractHtmlFromList(paramLinks.sample)
    return {
      label: 'BODY',
      message: `Links with parameters: ${paramLinks.total}`,
      type: 'info',
      priority: paramLinks.total ? 700 : 900,
      name: 'Links with query params',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths: getDomPaths(paramLinks.sample),
        hrefs,
        hrefsTruncated: paramLinks.total > hrefs.length,
        count: paramLinks.total, shown: paramLinks.shown, truncated: paramLinks.truncated,
      },
    }
  },
}
