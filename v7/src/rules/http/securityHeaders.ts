
import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const RECOMMENDED_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-resource-policy',
]

export const securityHeadersRule: Rule = {
  id: 'http:security-headers', name: 'Security Headers', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'general',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html',
      'https://web.dev/articles/security-headers',
    ],
    description: 'Checks presence of five security response headers (content-security-policy, x-content-type-options, referrer-policy, permissions-policy, cross-origin-resource-policy); ok when all present, info listing the missing ones otherwise.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(securityHeadersRule, page, RECOMMENDED_HEADERS.join(', '))
    const headers = page.headers || {}
    const presentHeaders = RECOMMENDED_HEADERS.filter((name) => headers[name])
    const missingHeaders = RECOMMENDED_HEADERS.filter((name) => !headers[name])
    const allPresent = missingHeaders.length === 0
    return presentResult(securityHeadersRule, page, {
      input: 'HTTP response headers', type: allPresent ? 'ok' : 'info', priority: allPresent ? 750 : 800,
      values: [textField('Headers present', `${presentHeaders.length} of ${RECOMMENDED_HEADERS.length}`),
        textField('Absent headers', listRow(missingHeaders))],
      checked: [textField('Headers checked', RECOMMENDED_HEADERS.join(', ')),
        textField('Criterion', 'ok requires all listed headers present')],
      // One record per present header, named by the header, with its complete captured value.
      evidence: presentHeaders.map((name) => ({ name, fields: [textField('Value', headers[name]!)] })),
      noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
  },
}
