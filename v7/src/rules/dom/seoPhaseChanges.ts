import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
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
        input: [before && 'Static DOM', after && 'Idle DOM'].filter(Boolean).join(' + ') || 'Not captured',
        type: 'info', priority: 750,
        values: [textField('Static DOM facts', before ? 'Captured' : 'Not captured'), textField('Idle DOM facts', after ? 'Captured' : 'Not captured')],
        checked: [...checked, textField('Requirement', 'Both lifecycle observations are required for this comparison')],
        noMarkup: 'None - both lifecycle observations are required for this comparison',
      })
    }
    const groups = Object.keys(before)
    const changed = groups.filter((key) => before[key]?.fingerprint !== after[key]?.fingerprint || before[key]?.count !== after[key]?.count)
    return presentResult(seoPhaseChangesRule, page, {
      input: 'Static DOM + Idle DOM', type: 'info', priority: 750,
      values: [textField('SEO element groups changed', changed.length)],
      detailValues: [textField('Changed groups', changed.join(', ') || 'None')],
      checked: [...checked, textField('Element groups', groups.join(', ')), textField('Criterion', 'A change may reflect values, order, or count; not source HTML or JavaScript-disabled rendering')],
      evidence: groups.map((key) => ({ name: `Group: ${key}`, fields: [
        textField('Count (document_end)', before[key]?.count ?? 0), textField('Count (document_idle)', after[key]?.count ?? 0),
        textField('Changed', changed.includes(key) ? 'Yes' : 'No'),
      ] })),
      noMarkup: 'None - this rule compares selector match counts and fingerprints across DOM phases, not element markup',
    })
  },
}
