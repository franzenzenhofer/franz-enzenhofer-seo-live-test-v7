import type { Rule } from '@/core/types'

export const http3AdvertisedRule: Rule = {
  id: 'http:h3-advertised',
  name: 'HTTP/3 Advertised (Alt-Svc)',
  enabled: true,
  async run(page) {
    const alt = (page.headers?.['alt-svc'] || '').toLowerCase()
    return /\bh3\b|h3-/.test(alt)
      ? { label: 'HTTP', message: 'Alt-Svc advertises HTTP/3', type: 'info' }
      : { label: 'HTTP', message: 'HTTP/3 not advertised', type: 'info' }
  },
}

