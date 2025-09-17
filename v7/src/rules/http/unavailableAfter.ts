import type { Rule } from '@/core/types'

const robots = (h?: Record<string,string>) => (h?.['x-robots-tag'] || '').toLowerCase()

export const unavailableAfterRule: Rule = {
  id: 'http:unavailable-after',
  name: 'X-Robots unavailable_after',
  enabled: true,
  async run(page) {
    const xr = robots(page.headers)
    const has = /unavailable_after\s*:\s*\S+/.test(xr)
    return has ? { label: 'HTTP', message: `unavailable_after set (${xr})`, type: 'warn' } : { label: 'HTTP', message: 'No unavailable_after', type: 'ok' }
  },
}

