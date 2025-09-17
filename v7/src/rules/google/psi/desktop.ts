import type { Rule } from '@/core/types'
import { runPSI } from '@/shared/psi'

export const psiDesktopRule: Rule = {
  id: 'psi:desktop',
  name: 'PSI v5 Desktop score',
  enabled: false,
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const key = String((vars as Record<string, unknown>)['google_page_speed_insights_key'] || '').trim()
    if (!key) return { label: 'PSI', message: 'No PSI key set', type: 'info' }
    const j = await runPSI(page.url, 'desktop', key)
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return { label: 'PSI', message: `Desktop performance: ${score}`, type: 'info' }
  },
}
