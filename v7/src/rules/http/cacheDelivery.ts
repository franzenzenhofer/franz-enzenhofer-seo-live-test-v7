import type { Rule } from '@/core/types'

export const cacheDeliveryRule: Rule = {
  id: 'http:cache-delivery',
  name: 'Delivered from cache (Age)',
  enabled: true,
  what: 'http',
  async run(page) {
    const age = Number(page.headers?.['age'] || '0')
    return {
      label: 'HTTP',
      message: age > 0 ? `Age: ${age} (from cache)` : 'No cache Age header',
      type: 'info',
      name: 'Delivered from cache (Age)',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

