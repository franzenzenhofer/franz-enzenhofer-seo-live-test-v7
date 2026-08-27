import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleMatchingElements } from '@/shared/domEvidence'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls#manage-url-parameters'

export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links',
  name: 'Links with query params',
  enabled: true,
  what: 'static',
  async run(page) {
    const paramLinks = sampleMatchingElements(
      page.doc.querySelectorAll<HTMLAnchorElement>('a[href]'),
      (anchor) => (anchor.getAttribute('href') || '').includes('?'),
    )

    const sourceHtml = extractHtmlFromList(paramLinks.sample)
    return {
      label: 'BODY',
      message: `Links with parameters: ${paramLinks.total}`,
      type: 'info',
      name: 'Links with query params',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths: getDomPaths(paramLinks.sample),
        count: paramLinks.total, shown: paramLinks.shown, truncated: paramLinks.truncated,
        reference: SPEC,
      },
    }
  },
}
