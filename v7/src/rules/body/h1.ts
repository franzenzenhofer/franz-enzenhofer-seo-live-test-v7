import { excerpt, inventory } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { listRow } from '@/shared/presentation/listRow'

const SELECTOR = 'h1'
const headingText = (node: Element) => (node.textContent || '').replace(/\s+/g, ' ').trim()
const checked = [textField('Selector', SELECTOR), textField('Criterion', 'At least one element with non-empty trimmed text'), textField('Image alt text', 'Not evaluated')]

// One heading: the original <h1> is the observed value; the count is shown only when there are several (F3, F4).
const overview = (total: number, empty: number, texts: string[], markup: DisplayField[]): DisplayField[] => {
  if (!total) return [textField('H1', 'Not found')]
  if (total === 1) return [...(empty ? [textField('Text', 'Empty')] : markup.length ? [] : [textField('Text', texts[0] || 'Empty')]), ...markup]
  return [textField('H1 headings', total), ...(empty ? [textField('Empty headings', empty)] : []),
    ...(markup.length ? [] : [textField('Headings', listRow(texts.map((text) => text || 'Empty')))]), ...markup]
}

export const h1Rule: Rule = {
  id: 'body:h1', name: 'H1 headings', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'general',
    references: ['https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines-2', 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'],
    description: 'Counts H1 elements and empty text; missing or all-empty headings warn, multiple non-empty headings are informational.',
  },
  async run(page) {
    const nodes = page.doc.querySelectorAll(SELECTOR)
    const { sample, total } = sampleElements(nodes)
    let empty = 0
    nodes.forEach((node) => { if (!headingText(node)) empty++ })
    const type = !total || empty === total ? 'warn' : total === 1 ? 'ok' : 'info'
    const records = inventory(sample, total, (node) => [textField('Text', excerpt(headingText(node)) || 'Empty')])
    return presentResult(h1Rule, page, {
      input: 'Static DOM', type, priority: type === 'ok' ? 1000 : type === 'info' ? 700 : total ? 200 : 0,
      values: overview(total, empty, sample.map((node) => excerpt(headingText(node), 60)), records.overviewMarkup),
      detailValues: total ? records.counts : [], checked, evidence: records.evidence,
      markup: records.markup, noMarkup: total ? 'Complete original heading markup not retained' : 'No H1 element found',
    })
  },
}
