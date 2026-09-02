import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Vary: User-Agent'
const RULE_ID = 'http:vary-user-agent'

export const varyUserAgentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      'https://httpwg.org/specs/rfc9110.html#field.vary',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary',
    ],
    description: 'Reports (info-only) whether the Vary response header includes User-Agent, relevant for dynamic-serving mobile configurations.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const varyHeader = page.headers?.['vary']?.trim() || ''
    const varyLower = varyHeader.toLowerCase()
    const includesUserAgent = varyLower.includes('user-agent')
    const hasVary = Boolean(varyHeader)
    const message = includesUserAgent
      ? `Vary includes User-Agent: ${varyHeader}`
      : hasVary
        ? `Vary present but no User-Agent: ${varyHeader}`
        : 'No Vary header. User-Agent not specified.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: includesUserAgent ? 750 : 850,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(varyHeader || '(not present)'),
        varyHeader,
        includesUserAgent,
        hasVary,
      },
    }
  },
}

