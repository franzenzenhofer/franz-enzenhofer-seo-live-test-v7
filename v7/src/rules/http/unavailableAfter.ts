import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'X-Robots unavailable_after'
const RULE_ID = 'http:unavailable-after'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag'

export const unavailableAfterRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const xRobotsTag = (page.headers?.['x-robots-tag'] || '').trim()
    const xRobotsLower = xRobotsTag.toLowerCase()
    const unavailableMatch = xRobotsLower.match(/unavailable_after\s*:\s*([^\s,]+)/)
    const hasUnavailableAfter = Boolean(unavailableMatch)
    const dateValue = unavailableMatch ? unavailableMatch[1] : ''
    let message = ''
    let type: 'ok' | 'warn' | 'info' = 'ok'
    let priority = 850
    if (!xRobotsTag) {
      message = 'No X-Robots-Tag header.'
      type = 'info'
      priority = 900
    } else if (hasUnavailableAfter) {
      message = `unavailable_after: ${dateValue} (Content will be removed from search after this date)`
      type = 'warn'
      priority = 150
    } else {
      message = 'X-Robots-Tag present, no unavailable_after directive.'
      type = 'ok'
      priority = 850
    }
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(xRobotsTag || '(not present)'),
        xRobotsTag,
        hasUnavailableAfter,
        dateValue,
        reference: SPEC,
      },
    }
  },
}

