import { extractPSIKey } from '../google-utils'

import { summarizePSI } from './summary'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

const NAME = 'V5 Mobile FCP/TBT'
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
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)
    const summary = summarizePSI(j, page.url, 'mobile')
    const grades: Grade[] = []
    const parts: string[] = []
    if (typeof summary.fcpMs === 'number') {
      grades.push(gradeFcp(summary.fcpMs))
      parts.push(`FCP ${summary.fcpMs}ms (good <= ${FCP_WARN_MS}ms, poor > ${FCP_ERROR_MS}ms)`)
    }
    if (typeof summary.tbtMs === 'number') {
      grades.push(gradeTbt(summary.tbtMs))
      parts.push(`TBT ${summary.tbtMs}ms (good < ${TBT_WARN_MS}ms, poor > ${TBT_ERROR_MS}ms)`)
    }
    if (!parts.length) {
      return { label: 'PSI', message: `Metrics unavailable [View report](${summary.testUrl})`, type: 'info', priority: 700, name: NAME, details: { ...summary } }
    }
    const type = worst(grades)
    const priority = type === 'error' ? 120 : type === 'warn' ? 300 : 850
    return {
      label: 'PSI',
      message: `${parts.join(', ')} [View report](${summary.testUrl})`,
      type,
      priority,
      name: NAME,
      details: { ...summary },
    }
  },
}
