import type { Rule } from '@/core/types'

export const canonicalRule: Rule = {
  id: 'head-canonical',
  name: 'Canonical Link',
  enabled: true,
  run: async (page) => {
    const el = page.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement|null
    if (!el || !el.href) return { label: 'HEAD', message: 'No canonical link found.', type: 'error', what: 'static' }
    return { label: 'HEAD', message: `Canonical: ${el.href}`, type: 'info', what: 'static' }
  },
}

