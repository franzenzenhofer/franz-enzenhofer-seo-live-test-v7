import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

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
      values: [textField('Security headers present', `${presentHeaders.length} of ${RECOMMENDED_HEADERS.length}`),
        textField('Missing headers', missingHeaders.length ? missingHeaders.join(', ') : 'None')],
      detailValues: [textField('Present headers', presentHeaders.join(', ') || 'None')],
      checked: [textField('Headers checked', RECOMMENDED_HEADERS.join(', ')),
        textField('Criterion', 'ok requires all listed headers present')],
      evidence: [{ name: 'Checked headers', fields: RECOMMENDED_HEADERS.map((name) => textField(name, headers[name] || 'Not present')) }],
      noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
  },
}
