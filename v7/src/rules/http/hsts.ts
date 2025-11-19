import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Strict-Transport-Security (HSTS)'
const RULE_ID = 'http:hsts'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'

export const hstsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const hstsHeader = page.headers?.['strict-transport-security']?.trim() || ''
    const hasHsts = Boolean(hstsHeader)
    if (!hasHsts) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Missing Strict-Transport-Security header. HTTPS sites should use HSTS.',
        type: 'warn',
        priority: 300,
        details: {
          httpHeaders: page.headers || {},
          snippet: extractSnippet('(not present)'),
          hstsHeader: '',
          hasHsts: false,
          reference: SPEC,
        },
      }
    }
    const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/)
    const maxAge = maxAgeMatch && maxAgeMatch[1] ? parseInt(maxAgeMatch[1], 10) : 0
    const includeSubDomains = /includeSubDomains/i.test(hstsHeader)
    const preload = /preload/i.test(hstsHeader)
    const message = `HSTS: max-age=${maxAge}${includeSubDomains ? ', includeSubDomains' : ''}${preload ? ', preload' : ''}`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'ok',
      priority: 750,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(hstsHeader),
        hstsHeader,
        hasHsts: true,
        maxAge,
        includeSubDomains,
        preload,
        reference: SPEC,
      },
    }
  },
}

