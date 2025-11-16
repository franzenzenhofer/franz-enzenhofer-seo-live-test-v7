import type { Rule } from '@/core/types'

export const http3AdvertisedRule: Rule = {
  id: 'http:h3-advertised',
  name: 'HTTP/3 Advertised (Alt-Svc)',
  enabled: true,
  what: 'http',
  async run(page) {
    const alt = (page.headers?.['alt-svc'] || '').toLowerCase()
    return {
      label: 'HTTP',
      message: /\bh3\b|h3-/.test(alt) ? 'Alt-Svc advertises HTTP/3' : 'HTTP/3 not advertised',
      type: 'info',
      name: 'HTTP/3 Advertised (Alt-Svc)',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

