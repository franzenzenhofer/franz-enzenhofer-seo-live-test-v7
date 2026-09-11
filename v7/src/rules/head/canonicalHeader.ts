import type { Rule } from '@/core/types'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Canonical HTTP header'
const RULE_ID = 'head:canonical-header'
const checked = [
  textField('Header', 'Link'),
  textField('Relation', 'rel="canonical"'),
  textField('Criterion', 'No more than one rel="canonical" value'),
]
// This rule never inspects markup; every branch says so via the HTTP-input reason,
// never framed as an HTML element being absent.
const NO_MARKUP = 'None - this rule checks the HTTP Link response header, not document markup'

export const canonicalHeaderRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://www.rfc-editor.org/rfc/rfc6596',
    ],
    description: 'Parses the HTTP Link header for rel=canonical: info when absent, ok for exactly one, error for multiple header canonicals.',
  },
  async run(page) {
    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const header = linkHeaderOf(page.headers)
    const canonicals = parseHeaderCanonicals(header)
    const input = headersCaptured ? 'HTTP response headers' : 'Not captured'
    const evidence = [{ name: 'Captured header', fields: [
      textField('Link header (raw)', header || (headersCaptured ? 'Not present' : 'Not captured')),
    ] }]

    if (!canonicals.length) {
      // Evidence unavailability is reported factually: a header that was never
      // captured is not the same observation as a header confirmed absent.
      const headerStatus = !headersCaptured ? 'Not captured' : header ? 'Present, no rel="canonical" value' : 'Absent'
      return presentResult(canonicalHeaderRule, page, {
        input, type: 'info', priority: 600,
        values: [textField('Canonical header values', 0), textField('Link header', headerStatus)],
        checked, evidence, noMarkup: NO_MARKUP,
      })
    }

    const urls = canonicals.map((url, index) => urlField(`Canonical URL ${index + 1}`, url))
    const multiple = canonicals.length > 1
    return presentResult(canonicalHeaderRule, page, {
      input, type: multiple ? 'error' : 'ok', priority: multiple ? 120 : 800,
      values: [textField('Canonical header values', canonicals.length),
        textField('Link header', multiple ? 'Multiple rel="canonical" values' : 'One rel="canonical" value'),
        ...(multiple ? [] : urls)],
      detailValues: multiple ? urls : [], checked, evidence, noMarkup: NO_MARKUP,
    })
  },
}
