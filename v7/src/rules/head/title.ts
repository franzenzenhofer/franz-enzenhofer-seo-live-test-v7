import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > title'
const OVERVIEW_MARKUP_LIMIT = 3
const checked = [textField('Selector', SELECTOR), textField('Criterion', 'Exactly one element with non-empty trimmed text')]

// Overview: the measured trimmed length, then the complete <title> element(s); a count row only when there is not exactly one.
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
    if (total === 0) return presentResult(titleRule, page, {
      input: 'Static DOM', type: 'error', priority: 0,
      values: [textField('Title', 'Not found')], checked, noMarkup: 'No title element found in head',
    })
    const title = sample[0]?.textContent || ''
    const ok = total === 1 && title.trim().length > 0
    const records = elementRecords(sample, total)
    const overviewMarkup = records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : []
    return presentResult(titleRule, page, {
      input: 'Static DOM', type: ok ? 'ok' : 'error', priority: ok ? 1000 : 0,
      values: total === 1 ? [textField('Characters', title.trim().length), ...overviewMarkup] : [textField('Title elements', total), ...overviewMarkup],
      detailValues: [...sample.map((node, index) => textField(total === 1 ? 'Title' : `Title ${index + 1}`, node.textContent || '')), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup, noMarkup: 'Complete original title markup not retained',
    })
  },
}
