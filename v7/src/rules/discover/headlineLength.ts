import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const discoverHeadlineLengthRule: Rule = {
  id: 'discover:headline-length',
  name: 'Headline length',
  enabled: true,
  async run(page) {
    const el = page.doc.querySelector('h1')
    const h = (el?.textContent || '').trim()
    const n = h.length

    if (!n) {
      return { label: 'DISCOVER', message: 'No H1 headline', type: 'warn', name: 'headlineLength' }
    }

    const sourceHtml = extractHtml(el)
    const isLongEnough = n >= 20

    return isLongEnough
      ? {
          label: 'DISCOVER',
          message: `Headline length OK (${n})`,
          type: 'ok',
          name: 'headlineLength',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
        }
      : {
          label: 'DISCOVER',
          message: 'Headline may be too short',
          type: 'info',
          name: 'headlineLength',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
        }
  },
}

