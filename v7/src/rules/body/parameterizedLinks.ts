import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links',
  name: 'Links with query params',
  enabled: true,
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
      name: 'parameterizedLinks',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
      },
    }
  },
}

