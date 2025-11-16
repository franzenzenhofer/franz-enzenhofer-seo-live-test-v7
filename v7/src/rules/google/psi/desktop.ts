import { extractPSIKey } from '../google-utils'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

export const psiDesktopRule: Rule = {
  id: 'psi:desktop',
  name: 'PSI v5 Desktop score',
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'desktop', key)
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return { label: 'PSI', message: `Desktop performance: ${score}`, type: 'info', name: "googleRule", details: { url: page.url, strategy: 'desktop', score, apiResponse: j } }
  },
}
