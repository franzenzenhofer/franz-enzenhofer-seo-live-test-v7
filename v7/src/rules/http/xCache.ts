import type { Rule } from '@/core/types'

const v = (h: Record<string,string>|undefined, k: string) => (h?.[k] || h?.[k.toLowerCase()] || '').toLowerCase()

export const xCacheRule: Rule = {
  id: 'http:x-cache',
  name: 'X-Cache hit/miss',
  enabled: true,
  async run(page) {
    const x = v(page.headers, 'x-cache')
    if (!x)
      return {
        label: 'HTTP',
        message: 'No X-Cache header',
        type: 'info',
        name: 'xCache',
        details: { httpHeaders: page.headers || {} },
      }
    const t = x.includes('hit') ? 'HIT' : x.includes('miss') ? 'MISS' : x
    return {
      label: 'HTTP',
      message: `X-Cache: ${t}`,
      type: 'info',
      name: 'xCache',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

