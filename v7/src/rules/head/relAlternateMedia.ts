import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Rel Alternate Media'
const RULE_ID = 'head:rel-alternate-media'
const SELECTOR = 'head > link[rel="alternate"][media]'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel#alternate'

export const relAlternateMediaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    // 1. Query with precision selector
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
    const count = elements.length

    // 2. Determine states (Binary Logic)
    const isPresent = count > 0

    // 3. Extract media query data
    const mediaData = elements.map((link) => ({
      media: link.getAttribute('media')?.trim() || '',
      href: link.getAttribute('href')?.trim() || '',
    }))

    // 4. Get unique media queries
    const mediaQueries = [...new Set(mediaData.map((d) => d.media).filter(Boolean))]

    // 5. Build message (Quantified, showing the values)
    let message = ''
    if (!isPresent) {
      message = 'No rel=alternate media links found.'
    } else if (count === 1) {
      message = `1 rel=alternate media link (${mediaQueries[0] || 'missing media query'})`
    } else if (mediaQueries.length <= 2) {
      message = `${count} rel=alternate media links (${mediaQueries.join(', ') || 'missing media queries'})`
    } else {
      message = `${count} rel=alternate media links (${mediaQueries.slice(0, 2).join(', ') || 'missing media queries'}, +${mediaQueries.length - 2} more)`
    }

    // 6. Build evidence (Chain of Evidence)
    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = elements.map((_, idx) => (idx === 0 ? SELECTOR : `${SELECTOR}:nth-of-type(${idx + 1})`))

    const details = isPresent
      ? {
          sourceHtml,
          snippet: extractSnippet(sourceHtml, 200),
          domPaths,
          count,
          mediaQueries,
          mediaData,
          reference: SPEC,
        }
      : { reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type: isPresent ? 'warn' : 'info',
      priority: isPresent ? 750 : 900,
      details,
    }
  },
}
