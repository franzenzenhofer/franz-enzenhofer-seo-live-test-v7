import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > title'
const checked = [textField('Selector', SELECTOR), textField('Selected element', 'First match'),
  textField('Measurement', 'Trimmed text length in UTF-16 code units'), textField('Length threshold', 'None')]

// Overview: the measured number with its unit, then the complete <title> it was measured on (FORMATTING.md, worked layout).
export const titleLengthRule: Rule = {
  id: 'head:title', name: 'Page title length', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'general', references: ['https://developers.google.com/search/docs/appearance/title-link'],
    description: 'Measures the first title’s trimmed text length in UTF-16 code units; no length threshold.',
  },
  async run(page) {
    const titles = page.doc.querySelectorAll(SELECTOR)
    const element = titles[0]
    if (!element) return presentResult(titleLengthRule, page, {
      input: 'Static DOM', type: 'info', priority: 900,
      values: [textField('Title', 'Not found')], checked, noMarkup: 'No title element found in head',
    })
    const title = element.textContent || ''
    const records = elementRecords([element], titles.length)
    return presentResult(titleLengthRule, page, {
      input: 'Static DOM', type: 'info', priority: 760,
      values: [textField('Characters', title.trim().length), ...records.markup],
      detailValues: [...(titles.length > 1 ? [textField('Title elements', titles.length)] : []), textField('Title', title), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup, noMarkup: 'Complete original title markup not retained',
    })
  },
}
