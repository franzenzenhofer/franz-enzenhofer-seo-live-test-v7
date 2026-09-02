import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const MIN_WIDTH = 1200
const MIN_PIXELS = 300000
const SHOULD = `Declare og:image:width/og:image:height for an image at least ${MIN_WIDTH}px wide with more than ${MIN_PIXELS.toLocaleString('en-US')} total pixels`

const describeSize = (w: number, h: number) =>
  w > 0 && h > 0 ? `${w}x${h}px` : w > 0 ? `${w}px wide` : 'og:image:width and og:image:height meta tags missing'

export const discoverOgImageLargeRule: Rule = {
  id: 'discover:og-image-large',
  name: 'Large OG image (metadata)',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/google-discover',
      'https://ogp.me/',
    ],
    description: 'Checks og:image presence and that og:image:width/height metadata declares a width of at least 1200px and more than 300,000 total pixels.',
  },
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
        priority: 400,
        name: 'Large OG image (metadata)',
        details: { should: SHOULD },
      }
    }

    const hasBoth = w > 0 && h > 0
    const wideEnough = w >= MIN_WIDTH
    const enoughPixels = !hasBoth || w * h > MIN_PIXELS
    const ok = wideEnough && enoughPixels
    const elements = [imgEl, wEl, hEl].filter(Boolean) as Element[]
    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = getDomPaths(elements)

    if (ok) {
      return {
        label: 'DISCOVER',
        message: `OG image large: ${describeSize(w, h)}`,
        type: 'ok',
        priority: 850,
        name: 'Large OG image (metadata)',
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPaths, width: w, height: h > 0 ? h : undefined },
      }
    }

    const problem = !(w > 0)
      ? 'og:image size metadata missing (the image itself was not measured)'
      : !wideEnough
        ? `OG image ${describeSize(w, h)} is narrower than ${MIN_WIDTH}px`
        : `OG image ${describeSize(w, h)} has ${w * h} total pixels (needs more than ${MIN_PIXELS})`

    return {
      label: 'DISCOVER',
      message: problem,
      type: 'warn',
      priority: 450,
      name: 'Large OG image (metadata)',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths,
        width: w > 0 ? w : undefined,
        height: h > 0 ? h : undefined,
        is: problem,
        should: SHOULD,
      },
    }
  },
}
