import { requestPsi, psiApi, PSI_API_INPUT, PSI_NOT_MARKUP } from './psiFacts'
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
const metricRow = (key: string, ms: number | undefined): DisplayField => textField(key, typeof ms === 'number' ? `${ms} ms` : 'Not found')

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
    if (typeof summary.fcpMs === 'number') grades.push(gradeFcp(summary.fcpMs))
    if (typeof summary.tbtMs === 'number') grades.push(gradeTbt(summary.tbtMs))
    // Both metrics always have a row: the measured value, or Not found when Lighthouse did not report it.
    const values: DisplayField[] = [metricRow('FCP', summary.fcpMs), metricRow('TBT', summary.tbtMs)]

    const checked = [...psiApi(STRATEGY),
      textField('FCP criterion', `Passed <= ${FCP_WARN_MS}ms, warning above that, failed > ${FCP_ERROR_MS}ms`),
      textField('TBT criterion', `Passed < ${TBT_WARN_MS}ms, warning from that, failed > ${TBT_ERROR_MS}ms`)]
    const detailValues = [urlField('PSI report', summary.testUrl)]

    if (!grades.length) {
      return presentResult(psiMobileFcpTbtRule, page, {
        input: PSI_API_INPUT,
        type: 'info',
        priority: 700,
        values, detailValues, checked,
        noMarkup: PSI_NOT_MARKUP,
      })
    }

    const type = worst(grades)
    const priority = type === 'error' ? 120 : type === 'warn' ? 300 : 850
    return presentResult(psiMobileFcpTbtRule, page, {
      input: PSI_API_INPUT,
      type, priority, values, detailValues, checked,
      noMarkup: PSI_NOT_MARKUP,
    })
  },
}
