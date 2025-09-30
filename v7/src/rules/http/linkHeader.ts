import type { Rule } from '@/core/types'

export const linkHeaderRule: Rule = {
  id: 'http:link-header',
  name: 'Link Header',
  enabled: true,
  async run(page) {
    const v = page.headers?.['link']
    return {
      label: 'HTTP',
      message: v ? `Link: ${v}` : 'No Link header',
      type: 'info',
      name: 'linkHeader',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

