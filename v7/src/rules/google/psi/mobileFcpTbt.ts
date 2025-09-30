import type { Rule } from '@/core/types'
import { runPSI } from '@/shared/psi'

const getKey = (ctx: { globals: { variables?: Record<string, unknown> } }) => {
  const vars = ctx.globals.variables || {}
  return String((vars as Record<string, unknown>)['google_page_speed_insights_key'] || '').trim()
}

export const psiMobileFcpTbtRule: Rule = {
  id: 'psi:mobile-fcp-tbt',
  name: 'PSI v5 Mobile FCP/TBT',
  enabled: false,
  async run(page, ctx) {
    const key = getKey(ctx as { globals: { variables?: Record<string, unknown> } })
    if (!key) return { label: 'PSI', message: 'No PSI key set', type: 'info', name: "googleRule" }
    const j = await runPSI(page.url, 'mobile', key)
    const audits = j.lighthouseResult?.audits || {}
    const fcp = audits['first-contentful-paint']?.numericValue
    const tbt = audits['total-blocking-time']?.numericValue
    const parts = [typeof fcp === 'number' ? `FCP ${Math.round(fcp)}ms` : null, typeof tbt === 'number' ? `TBT ${Math.round(tbt)}ms` : null].filter(Boolean)
    return { label: 'PSI', message: parts.join(', ') || 'Metrics unavailable', type: 'info', name: "googleRule" }
  },
}
