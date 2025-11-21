import { extractPSIKey } from '../google-utils'

import { summarizePSI } from './summary'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const NAME = 'V5 Mobile score'

export const psiMobileRule: Rule = {
  id: 'psi:mobile',
  name: NAME,
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)
    const summary = summarizePSI(j, page.url, 'mobile')
    return { label: 'PSI', message: `Mobile performance: ${summary.score}`, type: 'info', name: NAME, details: summary }
  },
}
