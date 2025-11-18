import { extractPSIKey } from '../google-utils'

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
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return { label: 'PSI', message: `Mobile performance: ${score}`, type: 'info', name: NAME, details: { url: page.url, strategy: 'mobile', score, apiResponse: j } }
  },
}
