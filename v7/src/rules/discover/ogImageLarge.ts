import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const SPEC = 'https://developers.google.com/search/docs/appearance/google-discover/appearance'

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
      return {
        label: 'DISCOVER',
        message: 'Missing og:image meta tag',
        type: 'warn',
        name: 'Large OG image (metadata)',
        details: { sourceHtml: '', snippet: '', width: undefined, height: undefined, reference: SPEC },
      }
    }

    const ok = w >= 1200 || h >= 1200
    const elements = [imgEl, wEl, hEl].filter(Boolean) as Element[]
    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = getDomPaths(elements)

    return ok
      ? {
          label: 'DISCOVER',
          message: `OG image large: ${w}x${h}px`,
          type: 'ok',
          name: 'Large OG image (metadata)',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPaths, width: w, height: h, reference: SPEC },
        }
      : {
          label: 'DISCOVER',
          message: w && h ? `OG image ${w}x${h}px (<1200px)` : 'OG image size metadata missing',
          type: 'warn',
          name: 'Large OG image (metadata)',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPaths,
            width: w || undefined,
            height: h || undefined,
            reference: SPEC,
            is: w && h ? `${w}x${h}px` : 'og:image:width and og:image:height meta tags missing',
            should: 'Add og:image:width and og:image:height meta tags with at least 1200px on one side',
          },
        }
  },
}
