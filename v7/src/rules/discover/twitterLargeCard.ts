import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const discoverTwitterLargeCardRule: Rule = {
  id: 'discover:twitter-large-card',
  name: 'Twitter large card',
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.querySelector('meta[name="twitter:card"]')
    const v = (el?.getAttribute('content') || '').toLowerCase()
    const sourceHtml = extractHtml(el)

    return v === 'summary_large_image'
      ? {
          label: 'DISCOVER',
          message: 'twitter:card=summary_large_image',
          type: 'ok',
          name: 'Twitter large card',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
        }
      : {
          label: 'DISCOVER',
          message: 'twitter:card not summary_large_image',
          type: 'info',
          name: 'Twitter large card',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
        }
  },
}

