import type { Rule } from '@/core/types'

export const xRobotsRule: Rule = {
  id: 'http:x-robots',
  name: 'X-Robots-Tag',
  enabled: true,
  async run(page) {
    const v = page.headers?.['x-robots-tag']
    return {
      label: 'HTTP',
      message: v ? `X-Robots-Tag: ${v}` : 'No X-Robots-Tag',
      type: 'info',
      name: 'xRobots',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

