import { webUrlField } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

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
// What the Link header declares besides canonical, as a fact without the (URL-bearing) raw header text.
const relationsOf = (header: string) => [...new Set(Array.from(header.matchAll(/rel="?([^";,]+)"?/gi), (match) => match[1]!.trim().toLowerCase()))]

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
    const relations = header ? [textField('Link relations', listRow(relationsOf(header)))] : []

    if (!canonicals.length) {
      // Evidence unavailability is reported factually: a header that was never
      // captured is not the same observation as a header confirmed absent.
      const row = !headersCaptured ? textField('HTTP canonical', 'Not captured') : header ? textField('HTTP canonical', 'Not found') : textField('Link header', 'Absent')
      return presentResult(canonicalHeaderRule, page, {
        input: headersCaptured ? 'HTTP response headers' : 'Not captured', type: 'info', priority: 600,
        values: [row, ...relations], checked, noMarkup: NO_MARKUP,
      })
    }

    const multiple = canonicals.length > 1
    const urls = multiple
      ? [textField('HTTP canonicals', canonicals.length), ...canonicals.map((url, index) => webUrlField(`HTTP canonical ${index + 1}`, url))]
      : [webUrlField('HTTP canonical', canonicals[0]!)]
    return presentResult(canonicalHeaderRule, page, {
      input: 'HTTP response headers', type: multiple ? 'error' : 'ok', priority: multiple ? 120 : 800,
      values: urls, detailValues: relations, checked, noMarkup: NO_MARKUP,
    })
  },
}
