import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { parseDirectiveDate } from '@/shared/robotsDate'
import type { Rule } from '@/core/types'

// The date value may contain spaces and commas (RFC 822/850), so capture the
// rest of the header instead of stopping at the first space or comma.
const DIRECTIVE = /(?:^|[,;])\s*unavailable_after\s*:\s*(.+)$/i

export const unavailableAfterRule: Rule = {
  id: 'http:unavailable-after', name: 'X-Robots unavailable_after', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#unavailable_after',
    ],
    description: 'Warns when the X-Robots-Tag header contains an unavailable_after directive and errors when the removal date is already in the past.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(unavailableAfterRule, page, 'X-Robots-Tag')
    const xRobotsTag = (page.headers?.['x-robots-tag'] || '').trim()
    const match = DIRECTIVE.exec(xRobotsTag)
    const hasUnavailableAfter = Boolean(match?.[1])
    const { date, timestamp } = match?.[1] ? parseDirectiveDate(match[1]) : { date: '', timestamp: null }
    const past = timestamp !== null && timestamp < Date.now()

    let type: 'ok' | 'warn' | 'info' | 'error' = 'ok'
    let priority = 850
    let status = 'No unavailable_after directive'
    if (!xRobotsTag) { type = 'info'; priority = 900; status = 'Header not present' } else if (hasUnavailableAfter && past) {
      type = 'error'; priority = 80; status = 'Removal date is in the past'
    } else if (hasUnavailableAfter && timestamp === null) {
      type = 'warn'; priority = 300; status = 'Directive date is not parseable'
    } else if (hasUnavailableAfter) { type = 'warn'; priority = 150; status = 'Removal date is in the future' }

    return presentResult(unavailableAfterRule, page, {
      input: 'HTTP response headers', type, priority,
      values: [textField('X-Robots-Tag', xRobotsTag || 'Not present'),
        textField('unavailable_after date', hasUnavailableAfter ? date || 'Unparseable' : 'Not present'), textField('Status', status)],
      checked: [textField('Header', 'X-Robots-Tag'), textField('Directive', 'unavailable_after'),
        textField('Criterion', 'error once the removal date has passed; warn while a directive is present (a valid date means content is removed from search after that date; an unparseable date means Google ignores the directive); ok when the header lacks the directive')],
      evidence: xRobotsTag ? [{ name: 'X-Robots-Tag header', fields: [textField('X-Robots-Tag', xRobotsTag)] }] : [],
      noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
  },
}
