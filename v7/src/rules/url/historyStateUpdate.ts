import type { Rule } from '@/core/types'

export const historyStateUpdateRule: Rule = {
  id: 'url:history-state-update',
  name: 'History state update detected',
  enabled: true,
  async run(_page, ctx) {
    const ev = ((ctx.globals as { events?: Array<{ t?: string }> }).events) || []
    const hasHistory = ev.some((e) => e && e.t === 'nav:history')
    const hadCommit = ev.some((e) => e && e.t === 'nav:commit')
    return {
      label: 'URL',
      message:
        hasHistory && !hadCommit
          ? 'History state update (SPA navigation) observed'
          : 'No SPA-only history update detected',
      type: 'info',
      name: 'historyStateUpdate',
    }
  },
}

