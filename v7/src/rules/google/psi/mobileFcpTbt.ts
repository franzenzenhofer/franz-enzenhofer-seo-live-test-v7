import { extractPSIKey, createPSIKeyMissingResult } from '../google-utils'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

export const psiMobileFcpTbtRule: Rule = {
  id: 'psi:mobile-fcp-tbt',
  name: 'PSI v5 Mobile FCP/TBT',
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    if (!userKey) return createPSIKeyMissingResult()

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
