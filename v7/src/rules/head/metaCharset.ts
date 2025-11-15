import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const metaCharsetRule: Rule = {
  id: 'head:meta-charset',
  name: 'Meta charset',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector('meta[charset]')
    if (m) {
      const sourceHtml = extractHtml(m)
      return {
        name: 'Meta charset',
        label: 'HEAD',
        message: `charset=${m.getAttribute('charset') || ''}`,
        type: 'info',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(m),
        },
      }
    }
    return { name: 'Meta charset', label: 'HEAD', message: 'Missing meta[charset]', type: 'warn' }
  },
}

