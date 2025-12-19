import { extractPSIKey, PSI_API_REFERENCE } from '../google-utils'

import { summarizePSI } from './summary'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const NAME = 'V5 Mobile FCP/TBT'

export const psiMobileFcpTbtRule: Rule = {
  id: 'psi:mobile-fcp-tbt',
  name: NAME,
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)
    const summary = summarizePSI(j, page.url, 'mobile')
    const parts = [
      typeof summary.fcpMs === 'number' ? `FCP ${summary.fcpMs}ms` : null,
      typeof summary.tbtMs === 'number' ? `TBT ${summary.tbtMs}ms` : null,
    ].filter(Boolean)
    const metrics = parts.join(', ') || 'Metrics unavailable'
    return {
      label: 'PSI',
      message: `${metrics} [View report](${summary.testUrl})`,
      type: 'info',
      name: NAME,
      details: { ...summary, reference: PSI_API_REFERENCE },
    }
  },
}
