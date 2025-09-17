import type { Rule } from '@/core/types'

export const xRobotsRule: Rule = {
  id: 'http:x-robots',
  name: 'X-Robots-Tag',
  enabled: true,
  async run(page) {
    const v = page.headers?.['x-robots-tag']
    return v ? { label: 'HTTP', message: `X-Robots-Tag: ${v}`, type: 'info' } : { label: 'HTTP', message: 'No X-Robots-Tag', type: 'info' }
  },
}

