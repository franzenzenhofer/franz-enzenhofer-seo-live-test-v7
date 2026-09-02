import type { Rule } from '@/core/types'

const LABEL = 'SPEED'
const NAME = 'First Paint'
const RULE_ID = 'speed:first-paint'
// FCP thresholds per https://web.dev/articles/fcp: good <= 1.8s, poor > 3.0s.
const FCP_WARN_THRESHOLD_MS = 1800
const FCP_ERROR_THRESHOLD_MS = 3000

export const firstPaintRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'general',
    references: ['https://www.w3.org/TR/paint-timing/', 'https://web.dev/articles/fcp'],
    description: 'Grades first contentful paint per web.dev thresholds: ok <=1800ms, warn 1800-3000ms, error >3000ms; info when only first paint or no timing is available.',
  },
  async run(page) {
    const firstPaint = page.navigationTiming?.firstPaint ?? null
    const firstContentfulPaint = page.navigationTiming?.firstContentfulPaint ?? null

    if (firstPaint === null && firstContentfulPaint === null) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Paint timing not available.',
        type: 'info',
        priority: 900,
        details: { tested: 'Performance paint timing entries' },
      }
    }

    const roundedFp = firstPaint !== null ? Math.round(firstPaint) : null
    if (firstContentfulPaint === null) {
      return {
        label: LABEL,
        name: NAME,
        message: `Time to first paint: ${roundedFp}ms (no first-contentful-paint recorded; no official thresholds exist for first paint).`,
        type: 'info',
        priority: 750,
        details: { firstPaint: roundedFp, firstContentfulPaint: null, tested: 'Performance paint timing entries' },
      }
    }

    const rounded = Math.round(firstContentfulPaint)
    if (rounded <= 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'First contentful paint timing could not be calculated.',
        type: 'runtime_error',
        priority: 10,
        details: { firstPaint: roundedFp, firstContentfulPaint, tested: 'Performance paint timing entries' },
      }
    }

    const type = rounded > FCP_ERROR_THRESHOLD_MS ? 'error' : rounded > FCP_WARN_THRESHOLD_MS ? 'warn' : 'ok'
    const priority = type === 'error' ? 120 : type === 'warn' ? 400 : 850
    return {
      label: LABEL,
      name: NAME,
      message: `First contentful paint: ${rounded}ms (good <= ${FCP_WARN_THRESHOLD_MS}ms, poor > ${FCP_ERROR_THRESHOLD_MS}ms).`,
      type,
      priority,
      details: {
        firstPaint: roundedFp,
        firstContentfulPaint: rounded,
        tested: 'Performance paint timing entries',
      },
    }
  },
}
