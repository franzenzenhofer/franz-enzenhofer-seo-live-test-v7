import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const SPEC = 'https://developers.google.com/search/docs/appearance/google-discover/appearance#page-content'

export const discoverHeadlineLengthRule: Rule = {
  id: 'discover:headline-length',
  name: 'Headline length',
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.querySelector('h1')
    const h = (el?.textContent || '').trim()
    const n = h.length

    if (!n) {
      return {
        label: 'DISCOVER',
        message: 'No <h1> tag found',
        type: 'warn',
        name: 'Headline length',
        details: { reference: SPEC },
      }
    }

    const sourceHtml = extractHtml(el)
    const isLongEnough = n >= 20

    return isLongEnough
      ? {
          label: 'DISCOVER',
          message: `Headline length ${n} chars (>=20)`,
          type: 'ok',
          name: 'Headline length',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), headline: h, reference: SPEC },
        }
      : {
          label: 'DISCOVER',
          message: `Headline short: ${n} chars (<20)`,
          type: 'info',
          name: 'Headline length',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), headline: h, reference: SPEC },
        }
  },
}
