import { hrefField, hreflangOf, markupReason, overviewMarkup } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { sampleElements, sampleMatchingElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'
// A passing inventory ships every inspected link; the storage bound keeps as many whole records as fit (F5).
const INVENTORY_LIMIT = 1000

// Google documents ISO 639-1 (two-letter) languages, optional ISO 15924 script,
// optional ISO 3166-1 Alpha 2 (two-letter) region; es-419-style numeric regions
// and 3-letter language codes are explicitly unsupported.
const isValidHreflang = (value: string) =>
  /^(x-default|[a-z]{2}(-[a-z]{4})?(-[a-z]{2})?)$/i.test(value)

const checked = [
  textField('Selector', SELECTOR),
  textField('Validation pattern', 'x-default, or ISO 639-1 language with optional ISO 15924 script and ISO 3166-1 Alpha-2 region'),
  textField('Criterion', 'Every hreflang attribute value matches the pattern'),
]
const hreflangFields = (element: Element, base: string) => [textField('hreflang', hreflangOf(element) || 'Empty'), hrefField(element, base)]

export const hreflangValuesRule: Rule = {
  id: 'head:hreflang-values',
  name: 'Hreflang values',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/specialty/international/localized-versions'],
    description: 'Validates each hreflang attribute value against a lang[-script][-region] pattern plus x-default; warns listing invalid values.',
  },
  async run(page) {
    const elements = page.doc.querySelectorAll<HTMLLinkElement>(SELECTOR)
    if (!elements.length) {
      return presentResult(hreflangValuesRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Hreflang links', 0)], checked,
        noMarkup: 'No hreflang links found',
      })
    }

    const invalid = sampleMatchingElements(elements, (el) => !isValidHreflang(hreflangOf(el)))
    if (!invalid.total) {
      const all = sampleElements(elements, INVENTORY_LIMIT)
      const records = elementRecords(all.sample, all.total, (element) => hreflangFields(element, page.url))
      return presentResult(hreflangValuesRule, page, {
        input: 'Static DOM', type: 'ok', priority: 820,
        values: [textField('Hreflang links', elements.length), textField('Hreflang values', listRow([...new Set(all.sample.map(hreflangOf).filter(Boolean))])), ...overviewMarkup(records.markup)],
        detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
        noMarkup: markupReason(records, 'Complete original hreflang link markup not retained', 'No hreflang links found'),
      })
    }

    // The listed values cover every invalid link, the records the retained sample.
    const invalidValues = [...new Set(Array.from(elements).filter((el) => !isValidHreflang(hreflangOf(el))).map((el) => hreflangOf(el) || 'Empty'))]
    const records = elementRecords(invalid.sample, invalid.total, (element) => hreflangFields(element, page.url))
    return presentResult(hreflangValuesRule, page, {
      input: 'Static DOM', type: 'warn', priority: 220,
      values: [textField('Hreflang links', elements.length), textField('Invalid values', listRow(invalidValues)), ...overviewMarkup(records.markup)],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original invalid hreflang link markup not retained', 'No invalid hreflang value found'),
    })
  },
}
