import { extractPSIKey } from '../google-utils'

import { psiScoreVerdict, summarizePSI } from './summary'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const NAME = 'V5 Desktop score'

export const psiDesktopRule: Rule = {
  id: 'psi:desktop',
  name: NAME,
  enabled: true,
  what: 'psi',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/speed/docs/insights/v5/about',
      'https://developer.chrome.com/docs/lighthouse/performance/performance-scoring',
      'https://developers.google.com/speed/docs/insights/v5/get-started',
    ],
    description: 'Runs the PSI v5 API with strategy=desktop and grades the Lighthouse performance score.',
  },
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'desktop', key)
    const summary = summarizePSI(j, page.url, 'desktop')
    const verdict = psiScoreVerdict(summary.score)
    const msg = `Desktop performance: ${summary.score}/100 [View report](${summary.testUrl})`
    return { label: 'PSI', message: msg, type: verdict.type, priority: verdict.priority, name: NAME, details: { ...summary } }
  },
}
