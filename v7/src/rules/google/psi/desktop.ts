import { extractPSIKey } from '../google-utils'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const SPEC = 'https://developers.google.com/speed/docs/insights/v5/about'
const TESTED = 'Requested PageSpeed Insights (v5) desktop analysis and reported the performance score.'

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
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)
    return {
      label: 'PSI',
      message: `Desktop performance: ${score}`,
      type: 'info',
      name: NAME,
      details: { url: page.url, strategy: 'desktop', score, apiResponse: j, tested: TESTED, reference: SPEC },
    }
  },
}
