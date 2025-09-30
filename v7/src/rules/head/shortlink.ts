import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const shortlinkRule: Rule = {
  id: 'head:shortlink',
  name: 'Shortlink Header',
  enabled: true,
  async run(page) {
    const l = page.doc.querySelector('link[rel="shortlink"]')
    if (l) {
      const sourceHtml = extractHtml(l)
      return {
        label: 'HEAD',
        message: `shortlink: ${l.getAttribute('href') || ''}`,
        type: 'info',
        name: 'shortlink',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(l),
        },
      }
    }
    return { label: 'HEAD', message: 'No shortlink', type: 'info', name: 'shortlink' }
  },
}

