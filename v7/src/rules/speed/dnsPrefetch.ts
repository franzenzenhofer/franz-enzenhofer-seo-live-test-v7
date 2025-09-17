import type { Rule } from '@/core/types'

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  enabled: true,
  async run(page) {
    const n = page.doc.querySelectorAll('link[rel="dns-prefetch"]').length
    return n ? { label: 'SPEED', message: `dns-prefetch links: ${n}`, type: 'info' } : { label: 'SPEED', message: 'No dns-prefetch links', type: 'info' }
  },
}

