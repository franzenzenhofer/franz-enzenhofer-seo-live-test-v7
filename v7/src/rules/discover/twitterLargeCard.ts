import type { Rule } from '@/core/types'

export const discoverTwitterLargeCardRule: Rule = {
  id: 'discover:twitter-large-card',
  name: 'Discover: Twitter large card',
  enabled: true,
  async run(page) {
    const v = (page.doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '').toLowerCase()
    return v === 'summary_large_image'
      ? { label: 'DISCOVER', message: 'twitter:card=summary_large_image', type: 'ok' }
      : { label: 'DISCOVER', message: 'Consider twitter:card=summary_large_image', type: 'info' }
  },
}

