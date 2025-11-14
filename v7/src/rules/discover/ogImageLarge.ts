import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const discoverOgImageLargeRule: Rule = {
  id: 'discover:og-image-large',
  name: 'Large OG image (metadata)',
  enabled: true,
  async run(page) {
    const wEl = page.doc.querySelector('meta[property="og:image:width"]')
    const hEl = page.doc.querySelector('meta[property="og:image:height"]')
    const imgEl = page.doc.querySelector('meta[property="og:image"]')

    const w = parseInt((wEl?.getAttribute('content') || '').trim(), 10)
    const h = parseInt((hEl?.getAttribute('content') || '').trim(), 10)
    const has = !!imgEl

    if (!has) {
      return { label: 'DISCOVER', message: 'Missing og:image', type: 'warn', name: 'ogImageLarge' }
    }

    const ok = w >= 1200 || h >= 1200
    const elements = [imgEl, wEl, hEl].filter(Boolean) as Element[]
    const sourceHtml = extractHtmlFromList(elements)

    return ok
      ? {
          label: 'DISCOVER',
          message: 'OG image metadata suggests large image',
          type: 'ok',
          name: 'ogImageLarge',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml) },
        }
      : {
          label: 'DISCOVER',
          message: 'OG image <1200px or missing',
          type: 'info',
          name: 'ogImageLarge',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml) },
        }
  },
}

