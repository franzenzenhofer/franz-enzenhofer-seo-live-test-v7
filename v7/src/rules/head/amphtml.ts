import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const amphtmlRule: Rule = {
  id: 'head:amphtml',
  name: 'AMP HTML Link',
  enabled: true,
  what: 'static',
  async run(page) {
    const l = page.doc.querySelector('link[rel="amphtml"]')
    if (l) {
      const sourceHtml = extractHtml(l)
      return {
        name: 'AMP HTML Link',
        label: 'HEAD',
        message: `amphtml: ${l.getAttribute('href') || ''}`,
        type: 'info',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(l),
        },
      }
    }
    return { name: 'AMP HTML Link', label: 'HEAD', message: 'No amphtml link', type: 'info' }
  },
}

