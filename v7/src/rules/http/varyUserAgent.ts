import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Vary: User-Agent'
const RULE_ID = 'http:vary-user-agent'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary'

export const varyUserAgentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
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
        reference: SPEC,
      },
    }
  },
}

