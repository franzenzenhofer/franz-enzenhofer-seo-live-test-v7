import type { Rule } from '@/core/types'

export const cacheDeliveryRule: Rule = {
  id: 'http:cache-delivery',
  name: 'Delivered from cache (Age)',
  enabled: true,
  async run(page) {
    const age = Number(page.headers?.['age'] || '0')
    return age > 0 ? { label: 'HTTP', message: `Age: ${age} (from cache)`, type: 'info' } : { label: 'HTTP', message: 'No cache Age header', type: 'info' }
  },
}

