import type { Rule } from '@/core/types'
import { sampleMatchingElements } from '@/shared/domEvidence'
import {domPathField, textField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'

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

    const invalid = sampleMatchingElements(elements, (el) => !isValidHreflang((el.getAttribute('hreflang') || '').trim()))
    if (!invalid.total) {
      return presentResult(hreflangValuesRule, page, {
        input: 'Static DOM', type: 'ok', priority: 820,
        values: [textField('Hreflang links', elements.length), textField('Invalid values', 0)], checked,
        noMarkup: 'No invalid hreflang value found',
      })
    }

    const invalidValues = invalid.sample.map((el) => (el.getAttribute('hreflang') || '').trim()).filter(Boolean)
    const captured = markupEvidence(invalid.sample, 'Invalid hreflang link markup')
    return presentResult(hreflangValuesRule, page, {
      input: 'Static DOM', type: 'warn', priority: 220,
      values: [textField('Hreflang links', elements.length), textField('Invalid values', invalid.total)],
      detailValues: [textField('Invalid values (list)', invalidValues.join(', ')),
        textField('Invalid examples retained', invalid.shown), textField('Invalid examples omitted', invalid.total - invalid.shown)],
      checked,
      evidence: invalid.sample.map((el, index) => ({
        name: `Invalid hreflang ${index + 1}`,
        fields: [textField('Attribute value', (el.getAttribute('hreflang') || '').trim() || 'Empty'),
          domPathField('DOM path', captured.selectors[index], 'Not captured')],
      })),
      markup: captured.markup,
      noMarkup: 'Complete original invalid hreflang link markup not retained',
    })
  },
}
