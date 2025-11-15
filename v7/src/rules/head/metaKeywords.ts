import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const metaKeywordsRule: Rule = {
  id: 'head:meta-keywords',
  name: 'Meta Keywords',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector('meta[name="keywords"]')
    if (m) {
      const sourceHtml = extractHtml(m)
      return {
        name: 'Meta Keywords',
        label: 'HEAD',
        message: 'Meta keywords present (deprecated)',
        type: 'info',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(m),
        },
      }
    }
    return { name: 'Meta Keywords', label: 'HEAD', message: 'No meta keywords', type: 'ok' }
  },
}

