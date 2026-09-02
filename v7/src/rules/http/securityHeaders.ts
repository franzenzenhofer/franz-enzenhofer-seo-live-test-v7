import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Security Headers'
const RULE_ID = 'http:security-headers'
const RECOMMENDED_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-resource-policy',
]

export const securityHeadersRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'general',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html',
      'https://web.dev/articles/security-headers',
    ],
    description:
      'Checks presence of five security response headers (content-security-policy, x-content-type-options, referrer-policy, permissions-policy, cross-origin-resource-policy); ok when all present, info listing the missing ones otherwise.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const headers = page.headers || {}
    const presentHeaders: string[] = []
    const missingHeaders: string[] = []
    RECOMMENDED_HEADERS.forEach((headerName) => {
      if (headers[headerName]) {
        presentHeaders.push(headerName)
      } else {
        missingHeaders.push(headerName)
      }
    })
    const allPresent = missingHeaders.length === 0
    const message = allPresent
      ? `All ${RECOMMENDED_HEADERS.length} security headers present.`
      : `Missing ${missingHeaders.length} security header${missingHeaders.length > 1 ? 's' : ''}: ${missingHeaders.join(', ')}`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: allPresent ? 'ok' : 'info',
      priority: allPresent ? 750 : 800,
      details: {
        httpHeaders: headers,
        snippet: extractSnippet(missingHeaders.join(', ') || 'all present'),
        recommendedHeaders: RECOMMENDED_HEADERS,
        presentHeaders,
        missingHeaders,
        allPresent,
      },
    }
  },
}
