import type { Rule } from '@/core/types'

export const preconnectRule: Rule = {
  id: 'speed:preconnect',
  name: 'rel=preconnect',
  enabled: true,
  async run(page) {
    const n = page.doc.querySelectorAll('link[rel="preconnect"]').length
    return n ? { label: 'SPEED', message: `preconnect links: ${n}`, type: 'info' } : { label: 'SPEED', message: 'No preconnect links', type: 'info' }
  },
}

