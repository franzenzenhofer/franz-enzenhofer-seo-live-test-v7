import { PHASE_FACTS_MISSING_INPUT, phaseFactsMissingRow } from './phaseFactsMissing'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { listRow } from '@/shared/presentation/listRow'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'SEO elements across DOM phases'

export const seoPhaseChangesRule: Rule = {
  id: 'dom:seo-phase-changes', name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: { provenance: 'google', references: ['https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'],
    description: 'Compares all captured SEO element fingerprints at document_end and document_idle without transporting full HTML.' },
  async run(page) {
    const before = page.staticFacts?.seoSignals, after = page.idleFacts?.seoSignals
    const checked = [textField('Comparison', 'Per-group element count and order-sensitive fingerprint compared between document_end and document_idle')]
    if (!before || !after) {
      return presentResult(seoPhaseChangesRule, page, {
        input: PHASE_FACTS_MISSING_INPUT, type: 'info', priority: 750,
        values: [phaseFactsMissingRow(before, after)],
        checked: [...checked, textField('Requirement', 'Both lifecycle observations are required for this comparison')],
        noMarkup: 'None - both lifecycle observations are required for this comparison',
      })
    }
    const groups = Object.keys(before)
    const changed = groups.filter((key) => before[key]?.fingerprint !== after[key]?.fingerprint || before[key]?.count !== after[key]?.count)
    const unchanged = groups.filter((key) => !changed.includes(key))
    return presentResult(seoPhaseChangesRule, page, {
      input: 'Static DOM + Idle DOM', type: 'info', priority: 750,
      values: [textField('Changed groups', listRow(changed)), textField('Unchanged groups', listRow(unchanged))],
      // One row per group: the element count in each phase and whether value, order or count changed.
      detailValues: groups.map((key) => textField(key,
        `static ${before[key]?.count ?? 0}, idle ${after[key]?.count ?? 0}, ${changed.includes(key) ? 'changed' : 'unchanged'}`)),
      checked: [...checked, textField('Element groups', groups.join(', ')), textField('Criterion', 'A change may reflect values, order, or count; not source HTML or JavaScript-disabled rendering')],
      noMarkup: 'None - this rule compares selector match counts and fingerprints across DOM phases, not element markup',
    })
  },
}
