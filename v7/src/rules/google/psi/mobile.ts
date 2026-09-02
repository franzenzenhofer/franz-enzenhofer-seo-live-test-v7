import { extractPSIKey } from '../google-utils'

import { psiScoreVerdict, summarizePSI } from './summary'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const NAME = 'V5 Mobile score'

export const psiMobileRule: Rule = {
  id: 'psi:mobile',
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
    description: 'Runs the PSI v5 API with strategy=mobile and grades the Lighthouse performance score.',
  },
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)
    const summary = summarizePSI(j, page.url, 'mobile')
    const verdict = psiScoreVerdict(summary.score)
    const msg = `Mobile performance: ${summary.score}/100 [View report](${summary.testUrl})`
    return { label: 'PSI', message: msg, type: verdict.type, priority: verdict.priority, name: NAME, details: { ...summary } }
  },
}
