import type { Rule } from '@/core/types'

export const http2AdvertisedRule: Rule = {
  id: 'http:h2-advertised',
  name: 'HTTP/2 Advertised (Alt-Svc)',
  enabled: true,
  async run(page) {
    const alt = (page.headers?.['alt-svc'] || '').toLowerCase()
    return /\bh2\b|h2=/.test(alt)
      ? { label: 'HTTP', message: 'Alt-Svc advertises HTTP/2', type: 'info' }
      : { label: 'HTTP', message: 'HTTP/2 not advertised', type: 'info' }
  },
}

