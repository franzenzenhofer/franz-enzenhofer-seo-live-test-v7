import type { Rule } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'HTTP Header Captured'
const RULE_ID = 'http:headers-present'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers'

export const headersPresentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const hasHeaders = page.headers && Object.keys(page.headers).length > 0
    if (!hasHeaders) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No HTTP headers captured. Page may have been served from cache; header-dependent checks might fail.',
        type: 'warn',
        priority: 1200,
        details: { httpHeaders: page.headers || {}, status: page.status, fromCache: page.fromCache ?? null, reference: SPEC },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: 'HTTP headers captured.',
      type: 'info',
      priority: 900,
      details: { httpHeaders: page.headers || {}, status: page.status, fromCache: page.fromCache ?? null, reference: SPEC },
    }
  },
}
