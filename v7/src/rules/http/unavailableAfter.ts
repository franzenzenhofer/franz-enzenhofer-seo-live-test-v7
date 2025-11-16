import type { Rule } from '@/core/types'

const robots = (h?: Record<string,string>) => (h?.['x-robots-tag'] || '').toLowerCase()

export const unavailableAfterRule: Rule = {
  id: 'http:unavailable-after',
  name: 'X-Robots unavailable_after',
  enabled: true,
  what: 'http',
  async run(page) {
    const xr = robots(page.headers)
    const has = /unavailable_after\s*:\s*\S+/.test(xr)
    return {
      label: 'HTTP',
      message: has ? `unavailable_after set (${xr})` : 'No unavailable_after',
      type: has ? 'warn' : 'ok',
      name: 'X-Robots unavailable_after',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

