import type { Rule } from '@/core/types'

export const relAlternateMediaRule: Rule = {
  id: 'head:rel-alternate-media',
  name: 'rel=alternate media',
  enabled: true,
  async run(page) {
    const n = page.doc.querySelectorAll('link[rel="alternate"][media]').length
    return n ? { label: 'HEAD', message: `rel=alternate[media] links: ${n}`, type: 'info' } : { label: 'HEAD', message: 'No rel=alternate media links', type: 'info' }
  },
}

