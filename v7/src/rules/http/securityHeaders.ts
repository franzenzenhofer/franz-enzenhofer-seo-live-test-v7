import type { Rule } from '@/core/types'

const need = ['content-security-policy','x-content-type-options','referrer-policy','permissions-policy','cross-origin-resource-policy']

export const securityHeadersRule: Rule = {
  id: 'http:security-headers',
  name: 'Security headers presence',
  enabled: true,
  what: 'http',
  async run(page) {
    const h = page.headers || {}
    const missing = need.filter((k) => !h[k])
    return {
      label: 'HTTP',
      message: missing.length ? `Missing security headers: ${missing.join(', ')}` : 'Security headers present',
      type: 'info',
      name: 'Security headers presence',
      details: { httpHeaders: h },
    }
  },
}

