import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const relAlternateMediaRule: Rule = {
  id: 'head:rel-alternate-media',
  name: 'rel=alternate media',
  enabled: true,
  async run(page) {
    const links = page.doc.querySelectorAll('link[rel="alternate"][media]')
    const n = links.length
    if (n) {
      const sourceHtml = extractHtmlFromList(links)
      return {
        name: 'rel=alternate media',
        label: 'HEAD',
        message: `rel=alternate[media] links: ${n}`,
        type: 'info',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }
    return { name: 'rel=alternate media', label: 'HEAD', message: 'No rel=alternate media links', type: 'info' }
  },
}

