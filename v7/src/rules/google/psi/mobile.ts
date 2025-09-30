import type { Rule } from '@/core/types'
import { runPSI } from '@/shared/psi'

export const psiMobileRule: Rule = {
  id: 'psi:mobile',
  name: 'PSI v5 Mobile score',
  enabled: false,
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const key = String((vars as Record<string, unknown>)['google_page_speed_insights_key'] || '').trim()
    if (!key) return { label: 'PSI', message: 'No PSI key set', type: 'info', name: "googleRule" }
    const j = await runPSI(page.url, 'mobile', key)
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return { label: 'PSI', message: `Mobile performance: ${score}`, type: 'info', name: "googleRule" }
  },
}
