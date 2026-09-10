import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

export const h1Rule: Rule = {
  id: 'body:h1', name: 'H1 headings', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'general',
    references: ['https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines-2', 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'],
    description: 'Counts H1 elements and empty text; missing or all-empty headings warn, multiple non-empty headings are informational.',
  },
  async run(page) {
    const nodes = page.doc.querySelectorAll('h1')
    const { sample, total } = sampleElements(nodes)
    let empty = 0
    nodes.forEach((node) => { if (!(node.textContent || '').trim()) empty++ })
    const type = !total || empty === total ? 'warn' : total === 1 ? 'ok' : 'info'
    const captured = markupEvidence(sample, '<h1>')
    return presentResult(h1Rule, page, {
      input: 'Static DOM', type, priority: type === 'ok' ? 1000 : type === 'info' ? 700 : total ? 200 : 0,
      values: [textField('H1 elements', total), ...(empty ? [textField('Empty headings', empty)] : []),
        ...(total === 1 && captured.markup[0] ? [{ ...captured.markup[0], key: '<h1>' }] : [])],
      detailValues: sample.map((node, index) => textField(total === 1 ? 'Heading text' : `Heading ${index + 1} text`, node.textContent || '')),
      checked: [textField('Selector', 'h1'), textField('Criterion', 'At least one element with non-empty trimmed text'), textField('Image alt text', 'Not evaluated')],
      evidence: [{ name: 'Capture', fields: [textField('Elements retained', sample.length), textField('Elements omitted', total - sample.length), ...captured.fields] }],
      markup: captured.markup, noMarkup: total ? 'Complete original heading markup not retained' : 'No H1 element found',
    })
  },
}
