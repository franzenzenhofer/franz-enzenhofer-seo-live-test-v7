import type { Rule } from '@/core/types'
import { runPSI, getPSIKey } from '@/shared/psi'

export const psiMobileFcpTbtRule: Rule = {
  id: 'psi:mobile-fcp-tbt',
  name: 'PSI v5 Mobile FCP/TBT',
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
    const j = await runPSI(page.url, 'mobile', key)
    const audits = j.lighthouseResult?.audits || {}
    const fcp = audits['first-contentful-paint']?.numericValue
    const tbt = audits['total-blocking-time']?.numericValue
    const parts = [typeof fcp === 'number' ? `FCP ${Math.round(fcp)}ms` : null, typeof tbt === 'number' ? `TBT ${Math.round(tbt)}ms` : null].filter(Boolean)
    return {
      label: 'PSI',
      message: parts.join(', ') || 'Metrics unavailable',
      type: 'info',
      name: "googleRule",
      details: { url: page.url, strategy: 'mobile', fcp, tbt, apiResponse: j }
    }
  },
}
