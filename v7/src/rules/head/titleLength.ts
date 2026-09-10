import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > title'
export const titleLengthRule: Rule = {
  id: 'head:title', name: 'Page title length', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'general', references: ['https://developers.google.com/search/docs/appearance/title-link'],
    description: 'Measures the first title’s trimmed text length in UTF-16 code units; no length threshold.',
  },
  async run(page) {
    const titles = page.doc.querySelectorAll(SELECTOR)
    const element = titles[0]
    const title = element?.textContent || ''
    const captured = markupEvidence(element ? [element] : [], '<title>')
    return presentResult(titleLengthRule, page, {
      input: 'Static DOM', type: 'info', priority: element ? 760 : 900,
      values: [textField('Characters', element ? title.trim().length : 'Not measurable'),
        ...(captured.markup[0] ? [{ ...captured.markup[0], key: '<title>' }] : [])],
      detailValues: [textField('Title elements', titles.length), ...(element ? [textField('Title', title)] : [])],
      checked: [textField('Selector', SELECTOR), textField('Selected element', 'First match'),
        textField('Measurement', 'Trimmed text length in UTF-16 code units'), textField('Length threshold', 'None')],
      evidence: captured.fields.length ? [{ name: 'Source', fields: captured.fields }] : [],
      markup: captured.markup, noMarkup: element ? 'Complete original title markup not retained' : 'No title element found in head',
    })
  },
}
