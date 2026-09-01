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
    const headerCount = Object.keys(page.headers || {}).length
    if (!headerCount) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No HTTP headers captured. Page may have been served from cache; header-dependent checks might fail.',
        type: 'warn',
        priority: 350,
        details: { httpHeaders: page.headers || {}, headerCount, status: page.status, fromCache: page.fromCache ?? null, reference: SPEC },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: `${headerCount} HTTP response headers captured${typeof page.status === 'number' ? ` (HTTP ${page.status})` : ''}.`,
      type: 'info',
      priority: 900,
      details: { httpHeaders: page.headers || {}, headerCount, status: page.status, fromCache: page.fromCache ?? null, reference: SPEC },
    }
  },
}
