import type { Rule } from '@/core/types'

export const hstsRule: Rule = {
  id: 'http:hsts',
  name: 'Strict-Transport-Security',
  enabled: true,
  what: 'http',
  async run(page) {
    const v = page.headers?.['strict-transport-security']
    if (!v)
      return {
        label: 'HTTP',
        message: 'Missing HSTS header',
        type: 'warn',
        name: 'hsts',
        details: { httpHeaders: page.headers || {} },
      }
    return {
      label: 'HTTP',
      message: `HSTS: ${v}`,
      type: 'info',
      name: 'hsts',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

