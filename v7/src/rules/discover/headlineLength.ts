import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const HEURISTIC_MIN = 20
const SELECTOR = 'h1'

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
    const element = page.doc.querySelector(SELECTOR)
    const headline = (element?.textContent || '').trim()
    const characters = headline.length
    const captured = markupEvidence(element ? [element] : [], '<h1>')
    const type = !characters ? 'warn' : characters >= HEURISTIC_MIN ? 'ok' : 'info'
    const priority = !characters ? 300 : characters >= HEURISTIC_MIN ? 850 : 500
    return presentResult(discoverHeadlineLengthRule, page, {
      input: 'Idle DOM', type, priority,
      values: [
        textField('H1 heading', element ? 'Found' : 'Not found'),
        ...(element ? [textField('Characters', characters)] : []),
        ...(element ? [textField('Heuristic threshold', `${HEURISTIC_MIN} characters; Google sets no minimum length`)] : []),
        ...(element && !characters ? [textField('Headline text', 'Empty')] : []),
        ...(captured.markup[0] ? [{ ...captured.markup[0], key: '<h1>' }] : []),
      ],
      detailValues: element ? [textField('Headline', headline)] : [],
      checked: [
        textField('Selector', SELECTOR),
        textField('Selected element', 'First match'),
        textField('Measurement', 'Trimmed text length in UTF-16 code units'),
        textField('Criterion', `At least ${HEURISTIC_MIN} characters (editorial heuristic; Google sets no minimum length)`),
      ],
      evidence: captured.fields.length ? [{ name: 'Source', fields: captured.fields }] : [],
      markup: captured.markup,
      noMarkup: element ? 'Complete original h1 markup not retained' : 'No h1 element found',
    })
  },
}
