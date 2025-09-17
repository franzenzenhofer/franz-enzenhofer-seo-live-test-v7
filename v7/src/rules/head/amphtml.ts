import type { Rule } from '@/core/types'

export const amphtmlRule: Rule = {
  id: 'head:amphtml',
  name: 'AMP HTML Link',
  enabled: true,
  async run(page) {
    const l = page.doc.querySelector('link[rel="amphtml"]')
    return l ? { label: 'HEAD', message: `amphtml: ${l.getAttribute('href') || ''}`, type: 'info' } : { label: 'HEAD', message: 'No amphtml link', type: 'info' }
  },
}

