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
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const varyHeader = page.headers?.['vary']?.trim() || ''
    const varyLower = varyHeader.toLowerCase()
    const includesUserAgent = varyLower.split(',').some(field => field.trim() === 'user-agent')
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
        snippet: extractSnippet(varyHeader || '(not present)'),
        varyHeader,
        includesUserAgent,
        hasVary,
      },
    }
  },
}

