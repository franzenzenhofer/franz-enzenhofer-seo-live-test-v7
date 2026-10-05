import { hrefField, hreflangOf, markupReason, overviewMarkup } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'
// An inventory ships every link; the 32 KB storage bound keeps as many whole records as fit (FORMATTING.md F5).
const INVENTORY_LIMIT = 1000

const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'All matches'),
  textField('Criterion', 'Informational inventory; no pass/fail verdict'),
]
// Each repeated value with how often it is declared, e.g. "en (2 links)".
const duplicatesOf = (values: string[]) => [...new Set(values.filter((value, index) => value && values.indexOf(value) !== index))]
  .map((value) => `${value} (${values.filter((candidate) => candidate === value).length} links)`)

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
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR), INVENTORY_LIMIT)
    const count = elements.total
    if (!count) {
      return presentResult(hreflangRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Hreflang links', 0)],
        checked, noMarkup: 'No hreflang links found',
      })
    }

    const values = elements.sample.map(hreflangOf)
    const languages = [...new Set(values.filter(Boolean))]
    const duplicates = duplicatesOf(values)
    const records = elementRecords(elements.sample, count, (element) => [
      textField('hreflang', hreflangOf(element) || 'Not declared'), hrefField(element, page.url),
    ])
    return presentResult(hreflangRule, page, {
      input: 'Static DOM', type: 'info', priority: 710,
      values: [
        textField('Hreflang links', count),
        textField('Languages', listRow(languages)),
        ...(languages.some((value) => value.toLowerCase() === 'x-default') ? [] : [textField('x-default', 'Not declared')]),
        ...(duplicates.length ? [textField('Duplicate values', listRow(duplicates))] : []),
        ...overviewMarkup(records.markup),
      ],
      detailValues: records.counts,
      checked,
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: markupReason(records, 'Complete original hreflang link markup not retained', 'No hreflang links found'),
    })
  },
}
