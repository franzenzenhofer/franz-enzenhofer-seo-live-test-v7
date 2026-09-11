import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'History state update detected'

export const historyStateUpdateRule: Rule = {
  id: 'url:history-state-update', name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    userGuide: {
      check: "Detects a history update in a run without a document-load event. Page code can change browser history without an HTTP redirect. This is normal in many applications; it does not by itself prove that content, titles or canonical tags updated correctly.",
      action: "For application navigation, verify that directly opening the resulting URL delivers the intended content and that titles and canonical declarations match the new page.",
    },
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
      'https://developer.mozilla.org/en-US/docs/Web/API/History_API',
    ],
    description: 'Detects SPA navigation by finding history.pushState events in the navigation ledger without a corresponding document commit (info-only).',
  },
  async run(page, ctx) {
    const events = ((ctx.globals as { events?: Array<{ t?: string }> }).events) || []
    const hasHistory = events.some((e) => e && e.t === 'nav:history')
    const hadCommit = events.some((e) => e && e.t === 'nav:commit')
    const observedSpaNav = hasHistory && !hadCommit

    return presentResult(historyStateUpdateRule, page, {
      input: events.length ? 'Navigation events' : 'Not captured',
      type: 'info', priority: observedSpaNav ? 500 : 900,
      values: [textField('SPA history update observed', observedSpaNav ? 'Yes' : 'No')],
      detailValues: [
        textField('History (pushState/replaceState) events', hasHistory ? 'Present' : 'Absent'),
        textField('Document-commit events', hadCommit ? 'Present' : 'Absent'),
      ],
      checked: [
        textField('Event types', 'nav:history, nav:commit'),
        textField('Criterion', 'SPA-only navigation = at least one nav:history event and no nav:commit event among the recorded events'),
      ],
      evidence: [],
      noMarkup: 'None - this rule checks recorded navigation events, not document markup',
    })
  },
}
