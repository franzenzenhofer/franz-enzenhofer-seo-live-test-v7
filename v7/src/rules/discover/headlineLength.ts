import { overviewMarkup } from './discoverPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const HEURISTIC_MIN = 20
const SELECTOR = 'h1'
const checked = [
  textField('Selector', SELECTOR), textField('Selected element', 'First match'),
  textField('Measurement', 'Trimmed text length in UTF-16 code units'),
  textField('Criterion', `At least ${HEURISTIC_MIN} characters (editorial heuristic; Google sets no minimum length)`),
]

// Overview as the owner's title-length card: the measured number, then the complete <h1> it was measured on.
export const discoverHeadlineLengthRule: Rule = {
  id: 'discover:headline-length', name: 'Headline length', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/google-discover',
      'https://developers.google.com/search/docs/appearance/structured-data/article',
    ],
    description: 'Checks that the first h1 exists and is at least 20 characters long (ok >=20, info <20, warn if no h1).',
  },
  async run(page) {
    const headings = page.doc.querySelectorAll(SELECTOR)
    const element = headings[0]
    if (!element) return presentResult(discoverHeadlineLengthRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 300,
      values: [textField('H1 heading', 'Not found')], checked, noMarkup: 'No h1 element found',
    })
    const headline = (element.textContent || '').trim()
    const characters = headline.length
    const records = elementRecords([element], headings.length)
    return presentResult(discoverHeadlineLengthRule, page, {
      input: 'Idle DOM', type: !characters ? 'warn' : characters >= HEURISTIC_MIN ? 'ok' : 'info',
      priority: !characters ? 300 : characters >= HEURISTIC_MIN ? 850 : 500,
      values: [textField('Characters', characters), ...overviewMarkup(records.markup)],
      detailValues: [textField('Headline', headline), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup, noMarkup: 'Complete original h1 markup not retained',
    })
  },
}
