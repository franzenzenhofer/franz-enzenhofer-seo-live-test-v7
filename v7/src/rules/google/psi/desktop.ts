import { extractPSIKey, PSI_API_REFERENCE } from '../google-utils'

import { summarizePSI } from './summary'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const NAME = 'V5 Desktop score'

export const psiDesktopRule: Rule = {
  id: 'psi:desktop',
  name: NAME,
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'desktop', key)
    const summary = summarizePSI(j, page.url, 'desktop')
    const msg = `Desktop performance: ${summary.score} [View report](${summary.testUrl})`
    return { label: 'PSI', message: msg, type: 'info', name: NAME, details: { ...summary, reference: PSI_API_REFERENCE } }
  },
}
