import type { Rule } from '@/core/types'
import { runPSI, getPSIKey } from '@/shared/psi'

export const psiDesktopRule: Rule = {
  id: 'psi:desktop',
  name: 'PSI v5 Desktop score',
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const userKey = String((vars as Record<string, unknown>)['google_page_speed_insights_key'] || '')

    if (!userKey) {
      return {
        label: 'PSI',
        message: 'PageSpeed Insights API key not configured. Set google_page_speed_insights_key in settings.',
        type: 'runtime_error',
        name: 'googleRule',
        priority: -1000,
      }
    }

    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'desktop', key)
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return { label: 'PSI', message: `Desktop performance: ${score}`, type: 'info', name: "googleRule", details: { url: page.url, strategy: 'desktop', score, apiResponse: j } }
  },
}
