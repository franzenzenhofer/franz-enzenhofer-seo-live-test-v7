import type { Rule } from '@/core/types'

export const twitterCardRule: Rule = {
  id: 'head:twitter-card',
  name: 'Twitter Card',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[name="twitter:card"]')
    return m ? { label: 'HEAD', message: `twitter:card=${m.getAttribute('content') || ''}`, type: 'info' } : { label: 'HEAD', message: 'No twitter:card', type: 'info' }
  },
}

