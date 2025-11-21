import { extractPSIKey } from '../google-utils'

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
    return {
      label: 'PSI',
      message: parts.join(', ') || 'Metrics unavailable',
      type: 'info',
      name: NAME,
      details: summary,
    }
  },
}
