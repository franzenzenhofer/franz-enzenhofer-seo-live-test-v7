import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://web.dev/uses-rel-preconnect/'
const TESTED = 'Counted <link rel="preconnect"> hints declaring early connections.'

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
      details: n
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            preconnectCount: n,
            tested: TESTED,
            reference: SPEC,
          }
        : { tested: TESTED, reference: SPEC, preconnectCount: 0 },
    }
  },
}
