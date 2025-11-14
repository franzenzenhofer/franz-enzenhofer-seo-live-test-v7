import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const hreflangRule: Rule = {
  id: 'head-hreflang',
  name: 'Hreflang Links',
  enabled: true,
  run: async (page) => {
    const links = page.doc.querySelectorAll('link[rel="alternate"][hreflang]')
    if (links.length === 0)
      return { name: 'Hreflang Links', label: 'HEAD', message: 'No hreflang links found.', type: 'info' }
    const sourceHtml = extractHtmlFromList(links)
    return {
      name: 'Hreflang Links',
      label: 'HEAD',
      message: `Hreflang links: ${links.length}`,
      type: 'info',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
      },
    }
  },
}

