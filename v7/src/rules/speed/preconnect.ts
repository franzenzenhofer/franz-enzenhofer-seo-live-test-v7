import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://web.dev/uses-rel-preconnect/'

export const preconnectRule: Rule = {
  id: 'speed:preconnect',
  name: 'rel=preconnect',
  enabled: true,
  what: 'static',
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="preconnect"]')
    const n = links.length
    const sourceHtml = n ? extractHtmlFromList(links) : ''
    return {
      label: 'SPEED',
      message: n ? `preconnect links: ${n}` : 'No preconnect links',
      type: 'info',
      name: 'rel=preconnect',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        count: n,
        tested: 'Queried <link rel="preconnect">',
        reference: SPEC,
      },
    }
  },
}
