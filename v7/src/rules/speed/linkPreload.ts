import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://web.dev/uses-rel-preload/'
const TESTED = 'Counted <link rel="preload"> entries to verify resource preloading hints.'

export const linkPreloadRule: Rule = {
  id: 'speed:link-preload',
  name: 'rel=preload links',
  enabled: true,
  what: 'static',
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="preload"]')
    const n = links.length
    const sourceHtml = n ? extractHtmlFromList(links) : ''
    return {
      label: 'SPEED',
      message: n ? `preload links: ${n}` : 'No preload links',
      type: 'info',
      name: 'rel=preload links',
      details: n
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            preloadCount: n,
            tested: TESTED,
            reference: SPEC,
          }
        : { tested: TESTED, reference: SPEC, preloadCount: 0 },
    }
  },
}
