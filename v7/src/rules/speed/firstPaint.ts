import type { Rule } from '@/core/types'

const LABEL = 'SPEED'
const NAME = 'First Paint'
const RULE_ID = 'speed:first-paint'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming'
const WARN_THRESHOLD_MS = 700
const ERROR_THRESHOLD_MS = 1400

export const firstPaintRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const firstPaint = page.navigationTiming?.firstPaint ?? null
    const firstContentfulPaint = page.navigationTiming?.firstContentfulPaint ?? null

    if (firstPaint === null || firstPaint === undefined) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Paint timing not available.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    const rounded = Math.round(firstPaint)
    if (rounded <= 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'First paint timing could not be calculated.',
        type: 'runtime_error',
        priority: 10,
        details: { firstPaint, firstContentfulPaint, reference: SPEC },
      }
    }

    const type = rounded > ERROR_THRESHOLD_MS ? 'error' : rounded > WARN_THRESHOLD_MS ? 'warn' : 'ok'
    const priority = type === 'error' ? 120 : type === 'warn' ? 400 : 850
    return {
      label: LABEL,
      name: NAME,
      message: `Time to first paint: ${rounded}ms.`,
      type,
      priority,
      details: {
        firstPaint: rounded,
        firstContentfulPaint: firstContentfulPaint !== null && firstContentfulPaint !== undefined ? Math.round(firstContentfulPaint) : null,
        reference: SPEC,
        tested: 'Performance paint timing entries',
      },
    }
  },
}
