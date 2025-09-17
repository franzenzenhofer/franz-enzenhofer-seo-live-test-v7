import type { Rule } from '@/core/types'

export const hstsRule: Rule = {
  id: 'http:hsts',
  name: 'Strict-Transport-Security',
  enabled: true,
  async run(page) {
    const v = page.headers?.['strict-transport-security']
    if (!v) return { label: 'HTTP', message: 'Missing HSTS header', type: 'warn' }
    return { label: 'HTTP', message: `HSTS: ${v}`, type: 'info' }
  },
}

