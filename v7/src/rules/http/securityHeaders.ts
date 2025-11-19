import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Security Headers'
const RULE_ID = 'http:security-headers'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security'
const REQUIRED_HEADERS = [
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
  async run(page) {
    const headers = page.headers || {}
    const presentHeaders: string[] = []
    const missingHeaders: string[] = []
    REQUIRED_HEADERS.forEach((headerName) => {
      if (headers[headerName]) {
        presentHeaders.push(headerName)
      } else {
        missingHeaders.push(headerName)
      }
    })
    const allPresent = missingHeaders.length === 0
    const message = allPresent
      ? `All ${REQUIRED_HEADERS.length} security headers present.`
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
        requiredHeaders: REQUIRED_HEADERS,
        presentHeaders,
        missingHeaders,
        allPresent,
        reference: SPEC,
      },
    }
  },
}

