import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'First Paint'
const RULE_ID = 'speed:first-paint'
// FCP thresholds per https://web.dev/articles/fcp: good <= 1.8s, poor > 3.0s.
const FCP_WARN_THRESHOLD_MS = 1800
const FCP_ERROR_THRESHOLD_MS = 3000

export const firstPaintRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "First Contentful Paint (FCP) is when the browser first draws text, an image or other content. Values here are milliseconds from this page load; 1000 ms equals 1 second. One local run is not a field measurement across visitors or a complete performance assessment.",
      action: "Use the browser performance and network timelines to investigate slow server responses, render-blocking resources and delayed content. Make targeted changes, then compare repeated loads under consistent conditions.",
    },
    provenance: 'general',
    references: ['https://www.w3.org/TR/paint-timing/', 'https://web.dev/articles/fcp'],
    description: 'Grades first contentful paint per web.dev thresholds: ok <=1800ms, warn 1800-3000ms, error >3000ms; info when only first paint or no timing is available.',
  },
  async run(page) {
    const firstPaint = page.navigationTiming?.firstPaint ?? null
    const firstContentfulPaint = page.navigationTiming?.firstContentfulPaint ?? null
    const checked = [textField('Timing source', 'Performance paint timing entries'), textField('Rounding', 'Milliseconds, rounded to the nearest integer'),
      textField('FCP thresholds', `ok <= ${FCP_WARN_THRESHOLD_MS}ms; warn <= ${FCP_ERROR_THRESHOLD_MS}ms; error > ${FCP_ERROR_THRESHOLD_MS}ms`)]
    const paintValue = (ms: number | null) => ms === null ? 'Not recorded' : `${Math.round(ms)}ms`

    if (firstPaint === null && firstContentfulPaint === null) {
      return presentResult(firstPaintRule, page, {
        input: page.navigationTiming ? 'Navigation timing' : 'Not captured', type: 'info', priority: 900,
        values: [textField('First paint', 'Not recorded'), textField('First contentful paint', 'Not recorded')],
        detailValues: [textField('Timing completeness', 'Neither paint timing entry was captured')], checked,
        noMarkup: 'None - this rule reports navigation performance timing, not element markup',
      })
    }
    if (firstContentfulPaint === null) {
      return presentResult(firstPaintRule, page, {
        input: 'Navigation timing', type: 'info', priority: 750,
        values: [textField('First paint', paintValue(firstPaint)), textField('First contentful paint', 'Not recorded')],
        detailValues: [textField('Timing completeness', 'First paint captured; first-contentful-paint not recorded')], checked,
        noMarkup: 'None - this rule reports navigation performance timing, not element markup',
      })
    }
    const rounded = Math.round(firstContentfulPaint)
    if (rounded <= 0) {
      return presentResult(firstPaintRule, page, {
        input: 'Navigation timing', type: 'runtime_error', priority: 10,
        values: [textField('First paint', paintValue(firstPaint)), textField('First contentful paint', `${rounded}ms`)],
        detailValues: [textField('Timing completeness', 'First-contentful-paint captured but rounded to a non-positive, unusable value')], checked,
        noMarkup: 'None - this rule reports navigation performance timing, not element markup',
      })
    }
    const type = rounded > FCP_ERROR_THRESHOLD_MS ? 'error' : rounded > FCP_WARN_THRESHOLD_MS ? 'warn' : 'ok'
    const priority = type === 'error' ? 120 : type === 'warn' ? 400 : 850
    return presentResult(firstPaintRule, page, {
      input: 'Navigation timing', type, priority,
      values: [textField('First paint', paintValue(firstPaint)), textField('First contentful paint', `${rounded}ms`)],
      checked,
      noMarkup: 'None - this rule reports navigation performance timing, not element markup',
    })
  },
}
