import type { Rule } from '@/core/types'

export const varyUserAgentRule: Rule = {
  id: 'http:vary-user-agent',
  name: 'Vary: User-Agent',
  enabled: true,
  what: 'http',
  async run(page) {
    const vary = (page.headers?.['vary'] || '').toLowerCase()
    return {
      label: 'HTTP',
      message: vary.includes('user-agent')
        ? 'Vary includes User-Agent'
        : 'Vary does not include User-Agent',
      type: 'info',
      name: 'Vary: User-Agent',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

