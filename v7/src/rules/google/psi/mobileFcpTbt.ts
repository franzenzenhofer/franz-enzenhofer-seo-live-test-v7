import { requestPsi, psiApi, PSI_NOT_MARKUP } from './psiFacts'
import { summarizePSI } from './summary'

import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import type { Rule } from '@/core/types'

const NAME = 'V5 Mobile FCP/TBT'
const STRATEGY = 'mobile'
// FCP thresholds per https://web.dev/articles/fcp: good <= 1.8s, poor > 3.0s.
const FCP_WARN_MS = 1800
const FCP_ERROR_MS = 3000
// TBT lab guidance per https://web.dev/articles/tbt: good < 200ms; Lighthouse flags > 600ms as poor.
const TBT_WARN_MS = 200
const TBT_ERROR_MS = 600

type Grade = 'ok' | 'warn' | 'error'

const gradeFcp = (ms: number): Grade => (ms > FCP_ERROR_MS ? 'error' : ms > FCP_WARN_MS ? 'warn' : 'ok')
const gradeTbt = (ms: number): Grade => (ms > TBT_ERROR_MS ? 'error' : ms >= TBT_WARN_MS ? 'warn' : 'ok')
const worst = (grades: Grade[]): Grade => (grades.includes('error') ? 'error' : grades.includes('warn') ? 'warn' : 'ok')

export const psiMobileFcpTbtRule: Rule = {
  id: 'psi:mobile-fcp-tbt',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'psi',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/speed/docs/insights/v5/about',
      'https://web.dev/articles/fcp',
      'https://web.dev/articles/tbt',
    ],
    description: 'Grades mobile FCP (good <=1800ms, poor >3000ms) and TBT (good <200ms, poor >600ms) from the PSI mobile run.',
  },
  async run(page, ctx) {
    const outcome = await requestPsi(page.url, STRATEGY, ctx)
    if (!outcome.ok) return presentResult(psiMobileFcpTbtRule, page, outcome.facts)

    const summary = summarizePSI(outcome.json, page.url, STRATEGY)
    const grades: Grade[] = []
    const values: DisplayField[] = []
    if (typeof summary.fcpMs === 'number') { grades.push(gradeFcp(summary.fcpMs)); values.push(textField('First Contentful Paint (FCP)', `${summary.fcpMs} ms`)) }
    if (typeof summary.tbtMs === 'number') { grades.push(gradeTbt(summary.tbtMs)); values.push(textField('Total Blocking Time (TBT)', `${summary.tbtMs} ms`)) }

    const checked = [...psiApi(STRATEGY),
      textField('FCP criterion', `Passed <= ${FCP_WARN_MS}ms, warning above that, failed > ${FCP_ERROR_MS}ms`),
      textField('TBT criterion', `Passed < ${TBT_WARN_MS}ms, warning from that, failed > ${TBT_ERROR_MS}ms`)]
    const detailValues = [urlField('PageSpeed Insights report', summary.testUrl)]

    if (!values.length) {
      return presentResult(psiMobileFcpTbtRule, page, {
        input: 'Page URL + PageSpeed Insights API response',
        type: 'info',
        priority: 700,
        values: [textField('Mobile FCP/TBT', 'Not reported by PageSpeed Insights')],
        detailValues, checked,
        noMarkup: PSI_NOT_MARKUP,
      })
    }

    const type = worst(grades)
    const priority = type === 'error' ? 120 : type === 'warn' ? 300 : 850
    return presentResult(psiMobileFcpTbtRule, page, {
      input: 'Page URL + PageSpeed Insights API response',
      type, priority, values, detailValues, checked,
      noMarkup: PSI_NOT_MARKUP,
    })
  },
}
