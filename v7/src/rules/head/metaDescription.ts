import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[name="description" i]'
export const metaDescriptionRule: Rule = {
  id: 'head-meta-description', name: 'Meta description', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/special-tags', 'https://developers.google.com/search/docs/appearance/snippet'],
    description: 'Checks for exactly one meta description with a non-empty content attribute.',
  },
  async run(page) {
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const description = sample[0]?.getAttribute('content') || ''
    const ok = total === 1 && !!description.trim()
    const captured = markupEvidence(sample, 'Meta description')
    return presentResult(metaDescriptionRule, page, {
      input: 'Static DOM', type: total > 1 ? 'error' : ok ? 'ok' : 'warn', priority: ok ? 760 : total ? 100 : 0,
      values: [textField('Description elements', total), ...(total === 1 ? [textField('Characters', description.trim().length)] : []),
        ...(total === 1 && captured.markup[0] ? [{ ...captured.markup[0], key: '<meta name="description">' }] : [])],
      detailValues: sample.map((node, index) => textField(total === 1 ? 'Description' : `Description ${index + 1}`, node.getAttribute('content') ?? 'Attribute absent')),
      checked: [textField('Selector', SELECTOR), textField('Attribute', 'content'), textField('Criterion', 'Exactly one element with non-empty trimmed content'),
        textField('Length measurement', 'Trimmed content in UTF-16 code units')],
      evidence: [{ name: 'Capture', fields: [textField('Elements retained', sample.length), textField('Elements omitted', total - sample.length), ...captured.fields] }],
      markup: captured.markup, noMarkup: total ? 'Complete original meta description markup not retained' : 'No meta description element found',
    })
  },
}
