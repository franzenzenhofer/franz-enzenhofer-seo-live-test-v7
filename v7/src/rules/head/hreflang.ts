import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

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
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const count = elements.total
    const hreflangData = elements.sample.map((link) => ({
      hreflang: link.getAttribute('hreflang')?.trim() || '',
      href: link.getAttribute('href')?.trim() || '',
    }))
    const languages = [...new Set(hreflangData.map((d) => d.hreflang).filter(Boolean))]

    const sourceHtml = extractHtmlFromList(elements.sample)
    const domPaths = getDomPaths(elements.sample)

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
            shown: elements.shown,
            truncated: elements.truncated,
            languages,
            hreflangData,
            reference: SPEC,
          }
        : { reference: SPEC },
    }
  },
}
