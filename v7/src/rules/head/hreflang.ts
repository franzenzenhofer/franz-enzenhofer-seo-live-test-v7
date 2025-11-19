import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Hreflang Links'
const RULE_ID = 'head-hreflang'
const SELECTOR = 'head > link[rel="alternate"][hreflang]'
const SPEC = 'https://developers.google.com/search/docs/specialty/international/localized-versions'

export const hreflangRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  run: async (page) => {
    // 1. Query with precision selector
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
    const count = elements.length

    // 2. Determine states (Binary Logic)
    const isPresent = count > 0

    // 3. Extract hreflang data
    const hreflangData = elements.map((link) => ({
      hreflang: link.getAttribute('hreflang')?.trim() || '',
      href: link.getAttribute('href')?.trim() || '',
    }))

    // 4. Get unique language codes
    const languages = [...new Set(hreflangData.map((d) => d.hreflang).filter(Boolean))]

    // 5. Build message (Quantified, showing the values)
    let message = ''
    if (!isPresent) {
      message = 'No hreflang links found.'
    } else if (count === 1) {
      message = `1 hreflang link (${languages[0]})`
    } else if (languages.length <= 3) {
      message = `${count} hreflang links (${languages.join(', ')})`
    } else {
      message = `${count} hreflang links (${languages.slice(0, 3).join(', ')}, +${languages.length - 3} more)`
    }

    // 6. Build evidence (Chain of Evidence)
    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = elements.map(
      (_, idx) => (idx === 0 ? SELECTOR : `${SELECTOR}:nth-of-type(${idx + 1})`)
    )

    const details = isPresent
      ? {
          sourceHtml,
          snippet: extractSnippet(sourceHtml, 150),
          domPaths,
          count,
          languages,
          hreflangData,
          reference: SPEC,
        }
      : { reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: isPresent ? 700 : 900,
      details,
    }
  },
}

