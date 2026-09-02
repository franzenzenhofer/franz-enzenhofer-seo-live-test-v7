import type { Rule } from '@/core/types'

const LABEL = 'URL'
const NAME = 'History state update detected'
const TESTED = 'Inspected navigation event ledger for history.pushState usage without a corresponding document commit.'

export const historyStateUpdateRule: Rule = {
  id: 'url:history-state-update',
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
      'https://developer.mozilla.org/en-US/docs/Web/API/History_API',
    ],
    description: 'Detects SPA navigation by finding history.pushState events in the navigation ledger without a corresponding document commit (info-only).',
  },
  async run(_page, ctx) {
    const ev = ((ctx.globals as { events?: Array<{ t?: string }> }).events) || []
    const hasHistory = ev.some((e) => e && e.t === 'nav:history')
    const hadCommit = ev.some((e) => e && e.t === 'nav:commit')
    const observedSpaNav = hasHistory && !hadCommit
    return {
      label: LABEL,
      message: observedSpaNav ? 'History state update (SPA navigation) observed' : 'No SPA-only history update detected',
      type: 'info',
      priority: observedSpaNav ? 500 : 900,
      name: NAME,
      details: {
        tested: TESTED,
        historyEvents: hasHistory,
        commitEvents: hadCommit,
      },
    }
  },
}
