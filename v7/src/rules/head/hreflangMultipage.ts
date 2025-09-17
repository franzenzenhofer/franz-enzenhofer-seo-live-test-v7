import type { Rule } from '@/core/types'

export const hreflangMultipageRule: Rule = {
  id: 'head:hreflang-multipage',
  name: 'Hreflang multipage sanity',
  enabled: true,
  async run(page) {
    const links = Array.from(page.doc.querySelectorAll('link[rel="alternate"][hreflang]'))
    if (!links.length) return { label: 'HEAD', message: 'No hreflang links', type: 'info' }
    const langs = links.map(l => (l.getAttribute('hreflang') || '').toLowerCase())
    const dupl = langs.length !== new Set(langs).size
    const hasXDefault = langs.includes('x-default')
    if (dupl) return { label: 'HEAD', message: 'Duplicate hreflang entries', type: 'warn' }
    return hasXDefault ? { label: 'HEAD', message: 'hreflang set with x-default', type: 'ok' } : { label: 'HEAD', message: 'Consider adding x-default', type: 'info' }
  },
}

