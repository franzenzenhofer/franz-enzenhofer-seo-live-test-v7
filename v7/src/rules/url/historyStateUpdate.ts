import type { Rule } from '@/core/types'

const LABEL = 'URL'
const NAME = 'History state update detected'
const SPEC = 'https://developer.mozilla.org/docs/Web/API/History_API'
const TESTED = 'Inspected navigation event ledger for history.pushState usage without a corresponding document commit.'

export const historyStateUpdateRule: Rule = {
  id: 'url:history-state-update',
  name: NAME,
  enabled: true,
  what: 'static',
  async run(_page, ctx) {
    const ev = ((ctx.globals as { events?: Array<{ t?: string }> }).events) || []
    const hasHistory = ev.some((e) => e && e.t === 'nav:history')
    const hadCommit = ev.some((e) => e && e.t === 'nav:commit')
    const observedSpaNav = hasHistory && !hadCommit
    return {
      label: LABEL,
      message: observedSpaNav ? 'History state update (SPA navigation) observed' : 'No SPA-only history update detected',
      type: 'info',
      name: NAME,
      details: {
        tested: TESTED,
        historyEvents: hasHistory,
        commitEvents: hadCommit,
        reference: SPEC,
      },
    }
  },
}
