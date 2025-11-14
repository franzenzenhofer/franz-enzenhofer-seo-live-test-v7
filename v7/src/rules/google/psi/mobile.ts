import type { Rule } from '@/core/types'
import { runPSI, getPSIKey } from '@/shared/psi'

export const psiMobileRule: Rule = {
  id: 'psi:mobile',
  name: 'PSI v5 Mobile score',
  enabled: true,
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const userKey = String((vars as Record<string, unknown>)['google_page_speed_insights_key'] || '')
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return { label: 'PSI', message: `Mobile performance: ${score}`, type: 'info', name: "googleRule", details: { url: page.url, strategy: 'mobile', score, apiResponse: j } }
  },
}
