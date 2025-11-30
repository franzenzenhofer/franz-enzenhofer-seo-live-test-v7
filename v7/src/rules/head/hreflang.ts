import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Hreflang Links'
const RULE_ID = 'head-hreflang'
const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'
const SPEC = 'https://developers.google.com/search/docs/specialty/international/localized-versions'

export const hreflangRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  run: async (page) => {
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
    const count = elements.length
    const hreflangData = elements.map((link) => ({
      hreflang: link.getAttribute('hreflang')?.trim() || '',
      href: link.getAttribute('href')?.trim() || '',
    }))
    const languages = [...new Set(hreflangData.map((d) => d.hreflang).filter(Boolean))]

    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = elements.map(
      (_, idx) => (idx === 0 ? SELECTOR : `${SELECTOR}:nth-of-type(${idx + 1})`)
    )

    const message =
      count === 0
        ? 'No hreflang links found.'
        : `${count} link-rel-alternate hreflang found. ${languages.join(' ')}`

    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: count ? 710 : 900,
      details: count
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml, 150),
            domPaths,
            count,
            languages,
            hreflangData,
            reference: SPEC,
          }
        : { reference: SPEC },
    }
  },
}
