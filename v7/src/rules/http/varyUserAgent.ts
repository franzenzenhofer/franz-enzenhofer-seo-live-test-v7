import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Vary: User-Agent'
const RULE_ID = 'http:vary-user-agent'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

export const varyUserAgentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "Reports whether a cache is told that the response changes with the requesting browser or device. Vary: User-Agent matters when the server sends different HTML for that header; responsive CSS alone does not require it.",
      action: "If the server changes HTML by User-Agent, configure the response to include Vary: User-Agent and verify the cache serves the correct variant. Otherwise its absence needs no change.",
    },
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      'https://httpwg.org/specs/rfc9110.html#field.vary',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary',
    ],
    description: 'Reports (info-only) whether the Vary response header includes User-Agent, relevant for dynamic-serving mobile configurations.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) {
      return presentResult(varyUserAgentRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Header name', 'Vary'), textField('Capture requirement', 'Response headers must be captured')],
        noMarkup: NO_MARKUP,
      })
    }
    const varyHeader = page.headers?.['vary']?.trim() || ''
    const includesUserAgent = varyHeader.toLowerCase().split(',').some((field) => field.trim() === 'user-agent')
    const hasVary = Boolean(varyHeader)
    return presentResult(varyUserAgentRule, page, {
      input: 'HTTP response headers', type: 'info', priority: includesUserAgent ? 750 : 850,
      // The header value is the observed fact; the User-Agent token is what was queried on it (F11).
      values: hasVary ? [textField('Vary', varyHeader), textField('User-Agent', includesUserAgent ? 'Found' : 'Not found')] : [textField('Vary', 'Absent')],
      checked: [textField('Header name', 'Vary'), textField('Criterion', 'Comma-separated token equal to User-Agent, case-insensitive')],
      evidence: hasVary ? [{ name: 'Vary', fields: [textField('Value', varyHeader)] }] : [],
      noMarkup: NO_MARKUP,
    })
  },
}
