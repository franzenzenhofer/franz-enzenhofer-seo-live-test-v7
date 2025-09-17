import type { Rule } from '@/core/types'

const need = ['content-security-policy','x-content-type-options','referrer-policy','permissions-policy','cross-origin-resource-policy']

export const securityHeadersRule: Rule = {
  id: 'http:security-headers',
  name: 'Security headers presence',
  enabled: true,
  async run(page) {
    const h = (page.headers || {})
    const missing = need.filter(k => !h[k])
    return missing.length ? { label: 'HTTP', message: `Missing security headers: ${missing.join(', ')}`, type: 'info' } : { label: 'HTTP', message: 'Security headers present', type: 'info' }
  },
}

