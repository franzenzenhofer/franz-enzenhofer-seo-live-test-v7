import type { Rule } from '@/core/types'

export const shortlinkRule: Rule = {
  id: 'head:shortlink',
  name: 'Shortlink Header',
  enabled: true,
  async run(page) {
    const l = page.doc.querySelector('link[rel="shortlink"]')
    return l ? { label: 'HEAD', message: `shortlink: ${l.getAttribute('href') || ''}`, type: 'info' } : { label: 'HEAD', message: 'No shortlink', type: 'info' }
  },
}

