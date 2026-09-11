import { requestPsi, psiApi, PSI_NOT_MARKUP } from './psiFacts'
import { psiScoreVerdict, summarizePSI } from './summary'

import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'V5 Mobile score'
const STRATEGY = 'mobile'

export const psiMobileRule: Rule = {
  id: 'psi:mobile',
  name: NAME,
  presentation: 1,
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
    const outcome = await requestPsi(page.url, STRATEGY, ctx)
    if (!outcome.ok) return presentResult(psiMobileRule, page, outcome.facts)

    const summary = summarizePSI(outcome.json, page.url, STRATEGY)
    if (summary.score === undefined) {
      return presentResult(psiMobileRule, page, {
        input: 'Page URL + PageSpeed Insights API response',
        type: 'info',
        priority: 900,
        values: [textField('Mobile performance score', 'Not reported by PageSpeed Insights')],
        detailValues: [urlField('PageSpeed Insights report', summary.testUrl)],
        checked: [...psiApi(STRATEGY), textField('Metric', 'Lighthouse performance category score')],
        noMarkup: PSI_NOT_MARKUP,
      })
    }

    const verdict = psiScoreVerdict(summary.score)
    return presentResult(psiMobileRule, page, {
      input: 'Page URL + PageSpeed Insights API response',
      type: verdict.type,
      priority: verdict.priority,
      values: [textField('Mobile performance score', `${summary.score}/100`)],
      detailValues: [urlField('PageSpeed Insights report', summary.testUrl), urlField('Final tested URL', summary.finalDisplayedUrl || page.url)],
      checked: [...psiApi(STRATEGY),
        textField('Metric', 'Lighthouse performance category score (0-100)'),
        textField('Criterion', '90-100 passed, 50-89 warning, 0-49 failed')],
      noMarkup: PSI_NOT_MARKUP,
    })
  },
}
