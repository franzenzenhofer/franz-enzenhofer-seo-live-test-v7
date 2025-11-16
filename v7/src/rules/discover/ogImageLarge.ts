import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const discoverOgImageLargeRule: Rule = {
  id: 'discover:og-image-large',
  name: 'Large OG image (metadata)',
  enabled: true,
  what: 'static',
  async run(page) {
    const wEl = page.doc.querySelector('meta[property="og:image:width"]')
    const hEl = page.doc.querySelector('meta[property="og:image:height"]')
    const imgEl = page.doc.querySelector('meta[property="og:image"]')

    const w = parseInt((wEl?.getAttribute('content') || '').trim(), 10)
    const h = parseInt((hEl?.getAttribute('content') || '').trim(), 10)
    const has = !!imgEl

    if (!has) {
      return { label: 'DISCOVER', message: 'Missing og:image meta tag', type: 'warn', name: 'ogImageLarge' }
    }

    const ok = w >= 1200 || h >= 1200
    const elements = [imgEl, wEl, hEl].filter(Boolean) as Element[]
    const sourceHtml = extractHtmlFromList(elements)

    return ok
      ? {
          label: 'DISCOVER',
          message: `OG image large: ${w}x${h}px`,
          type: 'ok',
          name: 'Large OG image (metadata)',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), width: w, height: h },
        }
      : {
          label: 'DISCOVER',
          message: w && h ? `OG image ${w}x${h}px (<1200px)` : 'OG image size metadata missing',
          type: 'info',
          name: 'Large OG image (metadata)',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), width: w || undefined, height: h || undefined },
        }
  },
}

