import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > title'
export const titleRule: Rule = {
  id: 'head-title', name: 'Page title', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/title-link',
      'https://html.spec.whatwg.org/multipage/semantics.html#the-title-element',
    ],
    description: 'Checks for exactly one non-empty title element in head.',
  },
  async run(page) {
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const title = sample[0]?.textContent || ''
    const ok = total === 1 && title.trim().length > 0
    const captured = markupEvidence(sample, '<title>')
    const primary = total === 1 && captured.markup[0] ? [{ ...captured.markup[0], key: '<title>' }] : []
    return presentResult(titleRule, page, {
      input: 'Static DOM', type: ok ? 'ok' : 'error', priority: ok ? 1000 : 0,
      values: [textField('Title elements', total), ...(total === 1 ? [textField('Title text', title.trim() ? 'Non-empty' : 'Empty')] : []), ...primary],
      detailValues: [...sample.map((node, index) => textField(total === 1 ? 'Title' : `Title ${index + 1}`, node.textContent || '')),
        ...(total === 1 ? [textField('Trimmed length (UTF-16 code units)', title.trim().length)] : [])],
      checked: [textField('Selector', SELECTOR), textField('Criterion', 'Exactly one element with non-empty trimmed text')],
      evidence: [{ name: 'Capture', fields: [textField('Elements retained', sample.length), textField('Elements omitted', total - sample.length), ...captured.fields] }],
      markup: captured.markup, noMarkup: total ? 'Complete original title markup not retained' : 'No title element found in head',
    })
  },
}
