import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { parseDirectiveDate } from '@/shared/robotsDate'
import type { Rule } from '@/core/types'
import type { DisplayField } from '@/shared/presentation/schema'

// The date value may contain spaces and commas (RFC 822/850), so capture the
// rest of the header instead of stopping at the first space or comma.
const DIRECTIVE = /(?:^|[,;])\s*unavailable_after\s*:\s*(.+)$/i
const HEADER = 'X-Robots-Tag'

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
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(unavailableAfterRule, page, HEADER)
    const xRobotsTag = (page.headers?.['x-robots-tag'] || '').trim()
    const match = DIRECTIVE.exec(xRobotsTag)
    const directive = match?.[1]?.trim() || ''
    const { date, timestamp } = directive ? parseDirectiveDate(directive) : { date: '', timestamp: null }
    const past = timestamp !== null && timestamp < Date.now()

    let type: 'ok' | 'warn' | 'info' | 'error' = 'ok'
    let priority = 850
    // The observed header, the directive value on it and the removal date verdict: facts, not sentences (F10).
    let values: DisplayField[] = [textField(HEADER, xRobotsTag), textField('unavailable_after', 'Not declared')]
    if (!xRobotsTag) { type = 'info'; priority = 900; values = [textField(HEADER, 'Absent')] } else if (directive && past) {
      type = 'error'; priority = 80; values = [textField(HEADER, xRobotsTag), textField('unavailable_after', date), textField('Removal date', 'In the past')]
    } else if (directive && timestamp === null) {
      type = 'warn'; priority = 300; values = [textField(HEADER, xRobotsTag), textField('unavailable_after', directive), textField('Removal date', 'Unparseable')]
    } else if (directive) {
      type = 'warn'; priority = 150; values = [textField(HEADER, xRobotsTag), textField('unavailable_after', date), textField('Removal date', 'In the future')]
    }

    return presentResult(unavailableAfterRule, page, {
      input: 'HTTP response headers', type, priority, values,
      checked: [textField('Header', HEADER), textField('Directive', 'unavailable_after'),
        textField('Criterion', 'error once the removal date has passed; warn while a directive is present (a valid date means content is removed from search after that date; an unparseable date means Google ignores the directive); ok when the header lacks the directive')],
      evidence: xRobotsTag ? [{ name: HEADER, fields: [textField('Value', xRobotsTag)] }] : [],
      noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
  },
}
