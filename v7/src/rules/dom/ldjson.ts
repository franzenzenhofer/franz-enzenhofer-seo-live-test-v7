import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson',
  name: 'LD+JSON presence',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = Array.from(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const n = scripts.length
    const sourceHtml = extractHtmlFromList(scripts)

    return n
      ? {
          label: 'DOM',
          message: `ld+json blocks: ${n}`,
          type: 'info',
          name: 'ldjson',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml) },
        }
      : { label: 'DOM', message: 'No ld+json', type: 'info', name: 'ldjson' }
  },
}

