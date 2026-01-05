import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls#manage-url-parameters'

export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links',
  name: 'Links with query params',
  enabled: true,
  what: 'static',
  async run(page) {
    const a = Array.from(page.doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
    const paramLinks: HTMLAnchorElement[] = []
    for (const x of a) {
      if ((x.getAttribute('href') || '').includes('?')) paramLinks.push(x)
    }

    const sourceHtml = extractHtmlFromList(paramLinks)
    return {
      label: 'BODY',
      message: `Links with parameters: ${paramLinks.length}`,
      type: 'info',
      name: 'Links with query params',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths: getDomPaths(paramLinks),
        reference: SPEC,
      },
    }
  },
}
