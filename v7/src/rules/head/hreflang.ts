import type { Rule } from '@/core/types'

export const hreflangRule: Rule = {
  id: 'head-hreflang',
  name: 'Hreflang Links',
  enabled: true,
  run: async (page) => {
    const links = page.doc.querySelectorAll('link[rel="alternate"][hreflang]')
    if (links.length === 0) return { label: 'HEAD', message: 'No hreflang links found.', type: 'info', what: 'static' }
    return { label: 'HEAD', message: `Hreflang links: ${links.length}`, type: 'info', what: 'static' }
  },
}

