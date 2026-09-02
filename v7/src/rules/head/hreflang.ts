import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

// Constants
const LABEL = 'HEAD'
const NAME = 'Hreflang Links'
const RULE_ID = 'head-hreflang'
const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'
// Full attribute capture for every hreflang link, bounded only by the
// content-script phase-message byte budget (stated via hreflangDataTruncated).
const PAIR_LIMIT = 200

export const hreflangRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/specialty/international/localized-versions'],
    description: 'Inventories head > link[rel=alternate][hreflang] elements: count, language list, and full hreflang/href pairs, always type info.',
  },
  run: async (page) => {
    const all = page.doc.querySelectorAll(SELECTOR)
    const elements = sampleElements(all)
    const count = elements.total
    // Attribute pairs are cheap: collect them for EVERY hreflang link (the
    // phase-message byte budget still applies, so state the in-rule bound).
    const hreflangData: Array<{ hreflang: string; href: string }> = []
    for (let index = 0; index < all.length && hreflangData.length < PAIR_LIMIT; index++) {
      const link = all.item(index)
      if (!link) continue
      hreflangData.push({
        hreflang: link.getAttribute('hreflang')?.trim() || '',
        href: link.getAttribute('href')?.trim() || '',
      })
    }
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
            hreflangDataTruncated: count > hreflangData.length,
          }
        : undefined,
    }
  },
}
