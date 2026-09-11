import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'
// Full attribute capture for every hreflang link, bounded only by the
// content-script phase-message byte budget (stated via the retained/omitted counts).
const PAIR_LIMIT = 200

const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'All matches'),
  textField('Attribute pairs captured', `Up to ${PAIR_LIMIT} hreflang/href pairs`),
  textField('Criterion', 'Informational inventory; no pass/fail verdict'),
]

export const hreflangRule: Rule = {
  id: 'head-hreflang',
  name: 'Hreflang Links',
  presentation: 1,
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
    const captured = markupEvidence(elements.sample, 'Hreflang link markup')

    if (!count) {
      return presentResult(hreflangRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Hreflang links', 0)],
        checked, noMarkup: 'No hreflang links found',
      })
    }

    // Attribute pairs are cheap: collect them for EVERY hreflang link (the
    // phase-message byte budget still applies, so the retained/omitted counts state the in-rule bound).
    const hreflangData: Array<{ hreflang: string; href: string }> = []
    for (let index = 0; index < all.length && hreflangData.length < PAIR_LIMIT; index++) {
      const link = all.item(index)
      if (!link) continue
      hreflangData.push({ hreflang: link.getAttribute('hreflang')?.trim() || '', href: link.getAttribute('href')?.trim() || '' })
    }
    const languages = [...new Set(hreflangData.map((d) => d.hreflang).filter(Boolean))]

    return presentResult(hreflangRule, page, {
      input: 'Static DOM', type: 'info', priority: 710,
      values: [textField('Hreflang links', count), textField('Distinct languages', languages.length)],
      detailValues: [
        textField('Languages', languages.join(', ') || 'None'),
        textField('Attribute pairs retained', hreflangData.length),
        textField('Attribute pairs omitted', count - hreflangData.length),
        textField('Markup elements retained', captured.markup.length),
        textField('Markup elements omitted', count - captured.markup.length),
      ],
      checked,
      evidence: hreflangData.map((pair, index) => ({
        name: `Hreflang ${index + 1}`,
        fields: [textField('Language', pair.hreflang || 'Not declared'),
          ...(pair.href ? [urlField('Href', pair.href)] : [textField('Href', 'Not declared')])],
      })),
      markup: captured.markup,
      noMarkup: 'Complete original hreflang link markup not retained',
    })
  },
}
