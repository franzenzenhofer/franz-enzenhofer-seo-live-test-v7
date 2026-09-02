import type { Rule } from '@/core/types'
import { parseDirectiveDate } from '@/shared/robotsDate'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'X-Robots unavailable_after'
const RULE_ID = 'http:unavailable-after'
// The date value may contain spaces and commas (RFC 822/850), so capture the
// rest of the header instead of stopping at the first space or comma.
const DIRECTIVE = /(?:^|[,;])\s*unavailable_after\s*:\s*(.+)$/i

export const unavailableAfterRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#unavailable_after',
    ],
    description: 'Warns when the X-Robots-Tag header contains an unavailable_after directive and errors when the removal date is already in the past.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const xRobotsTag = (page.headers?.['x-robots-tag'] || '').trim()
    const match = DIRECTIVE.exec(xRobotsTag)
    const hasUnavailableAfter = Boolean(match?.[1])
    const { date, timestamp } = match?.[1] ? parseDirectiveDate(match[1]) : { date: '', timestamp: null }
    const past = timestamp !== null && timestamp < Date.now()

    let message = ''
    let type: 'ok' | 'warn' | 'info' | 'error' = 'ok'
    let priority = 850
    if (!xRobotsTag) {
      message = 'No X-Robots-Tag header.'
      type = 'info'
      priority = 900
    } else if (hasUnavailableAfter && past) {
      message = `unavailable_after: ${date} (removal date already in the past)`
      type = 'error'
      priority = 80
    } else if (hasUnavailableAfter && timestamp === null) {
      message = `unavailable_after: ${date} (no valid date - Google ignores the rule)`
      type = 'warn'
      priority = 300
    } else if (hasUnavailableAfter) {
      message = `unavailable_after: ${date} (content will be removed from search after this date)`
      type = 'warn'
      priority = 150
    } else {
      message = 'X-Robots-Tag present, no unavailable_after directive.'
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
        dateValue: date,
        timestamp,
        past,
      },
    }
  },
}
