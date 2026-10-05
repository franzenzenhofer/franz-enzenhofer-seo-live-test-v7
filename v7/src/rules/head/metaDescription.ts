import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[name="description" i]'
const OVERVIEW_MARKUP_LIMIT = 3
const checked = [textField('Selector', SELECTOR), textField('Attribute', 'content'), textField('Criterion', 'Exactly one element with non-empty trimmed content'),
  textField('Length measurement', 'Trimmed content in UTF-16 code units')]

// Overview: the measured content length, then the complete <meta name="description"> element(s); a count row only when there is not exactly one.
export const metaDescriptionRule: Rule = {
  id: 'head-meta-description', name: 'Meta description', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/special-tags', 'https://developers.google.com/search/docs/appearance/snippet'],
    description: 'Checks for exactly one meta description with a non-empty content attribute.',
  },
  async run(page) {
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (total === 0) return presentResult(metaDescriptionRule, page, {
      input: 'Static DOM', type: 'warn', priority: 0,
      values: [textField('Meta description', 'Not found')], checked, noMarkup: 'No meta description element found',
    })
    const description = sample[0]?.getAttribute('content') || ''
    const ok = total === 1 && !!description.trim()
    const records = elementRecords(sample, total)
    const overviewMarkup = records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : []
    return presentResult(metaDescriptionRule, page, {
      input: 'Static DOM', type: total > 1 ? 'error' : ok ? 'ok' : 'warn', priority: ok ? 760 : 100,
      values: total === 1 ? [textField('Characters', description.trim().length), ...overviewMarkup] : [textField('Description elements', total), ...overviewMarkup],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: 'Complete original meta description markup not retained',
    })
  },
}
