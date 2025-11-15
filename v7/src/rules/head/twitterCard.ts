import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const twitterCardRule: Rule = {
  id: 'head:twitter-card',
  name: 'Twitter Card',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector('meta[name="twitter:card"]')
    if (m) {
      const sourceHtml = extractHtml(m)
      return {
        label: 'HEAD',
        message: `twitter:card=${m.getAttribute('content') || ''}`,
        type: 'info',
        name: 'twitterCard',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(m),
        },
      }
    }
    return { label: 'HEAD', message: 'No twitter:card', type: 'info', name: 'twitterCard' }
  },
}

