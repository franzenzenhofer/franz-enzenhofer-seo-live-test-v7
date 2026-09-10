import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const HEURISTIC_MIN = 20
const GUIDANCE = 'Use page titles and headlines that capture the essence of the content; avoid clickbait'

export const discoverHeadlineLengthRule: Rule = {
  id: 'discover:headline-length',
  name: 'Headline length',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Measures the text of the first h1 heading. The 20-character threshold is an editorial heuristic, not a Google requirement or a test of headline quality. A short name or concise headline can be appropriate.",
      action: "Give the page a clear main heading that accurately describes its content. Fill an empty heading or add one if needed; do not pad the wording merely to meet a character count.",
    },
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/google-discover',
      'https://developers.google.com/search/docs/appearance/structured-data/article',
    ],
    description: 'Checks that the first h1 exists and is at least 20 characters long (ok >=20, info <20, warn if no h1).',
  },
  async run(page) {
    const el = page.doc.querySelector('h1')
    const h = (el?.textContent || '').trim()
    const n = h.length

    if (!n) {
      return {
        label: 'DISCOVER',
        message: el ? 'The first h1 heading has no text.' : 'No h1 heading found.',
        type: 'warn',
        priority: 300,
        name: 'Headline length',
        details: { should: GUIDANCE },
      }
    }

    const sourceHtml = extractHtml(el)
    const isLongEnough = n >= HEURISTIC_MIN

    return isLongEnough
      ? {
          label: 'DISCOVER',
          message: `Headline length ${n} chars.`,
          type: 'ok',
          priority: 850,
          name: 'Headline length',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), headline: h },
        }
      : {
          label: 'DISCOVER',
          message: `Headline short: ${n} chars (heuristic threshold ${HEURISTIC_MIN}; Google sets no minimum length).`,
          type: 'info',
          priority: 500,
          name: 'Headline length',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(el),
            headline: h,
            is: `Headline is ${n} chars, below the ${HEURISTIC_MIN}-char heuristic (not a Google requirement)`,
            should: GUIDANCE,
          },
        }
  },
}
