import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const googlebotMetaRule: Rule = {
  id: 'head:meta-googlebot',
  name: 'Meta Googlebot',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[name="googlebot"]')
    if (m) {
      const sourceHtml = extractHtml(m)
      return {
        name: 'Meta Googlebot',
        label: 'HEAD',
        message: `googlebot: ${m.getAttribute('content') || ''}`,
        type: 'info',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(m),
        },
      }
    }
    return { name: 'Meta Googlebot', label: 'HEAD', message: 'No googlebot meta', type: 'info' }
  },
}

