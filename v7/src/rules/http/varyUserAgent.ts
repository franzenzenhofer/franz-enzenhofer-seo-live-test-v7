import type { Rule } from '@/core/types'

export const varyUserAgentRule: Rule = {
  id: 'http:vary-user-agent',
  name: 'Vary: User-Agent',
  enabled: true,
  async run(page) {
    const vary = (page.headers?.['vary'] || '').toLowerCase()
    return vary.includes('user-agent')
      ? { label: 'HTTP', message: 'Vary includes User-Agent', type: 'info' }
      : { label: 'HTTP', message: 'Vary does not include User-Agent', type: 'info' }
  },
}

