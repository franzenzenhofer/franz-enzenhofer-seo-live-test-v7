import type { Rule } from '@/core/types'

export const http2AdvertisedRule: Rule = {
  id: 'http:h2-advertised',
  name: 'HTTP/2 Advertised (Alt-Svc)',
  enabled: true,
  what: 'http',
  async run(page) {
    const alt = (page.headers?.['alt-svc'] || '').toLowerCase()
    return {
      label: 'HTTP',
      message: /\bh2\b|h2=/.test(alt) ? 'Alt-Svc advertises HTTP/2' : 'HTTP/2 not advertised',
      type: 'info',
      name: 'HTTP/2 Advertised (Alt-Svc)',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

