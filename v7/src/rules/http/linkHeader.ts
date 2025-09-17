import type { Rule } from '@/core/types'

export const linkHeaderRule: Rule = {
  id: 'http:link-header',
  name: 'Link Header',
  enabled: true,
  async run(page) {
    const v = page.headers?.['link']
    return v ? { label: 'HTTP', message: `Link: ${v}`, type: 'info' } : { label: 'HTTP', message: 'No Link header', type: 'info' }
  },
}

