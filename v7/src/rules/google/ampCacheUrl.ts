import type { Rule } from '@/core/types'

const ampHref = (d: Document) => d.querySelector('link[rel="amphtml"]')?.getAttribute('href') || ''
const ampCache = (href: string) => {
  try { const u = new URL(href); const host = u.host + u.pathname; return u.protocol === 'https:' ? `https://cdn.ampproject.org/c/s/${host}` : `https://cdn.ampproject.org/c/${host}` } catch { return '' }
}

export const ampCacheUrlRule: Rule = {
  id: 'google:amp-cache-url',
  name: 'AMP Cache URL',
  enabled: true,
  async run(page) {
    const href = ampHref(page.doc)
    if (!href) return { label: 'HEAD', message: 'No amphtml link', type: 'info' }
    const url = ampCache(href)
    return url ? { label: 'HEAD', message: `AMP Cache: ${url}`, type: 'info' } : { label: 'HEAD', message: 'AMP Cache not derivable', type: 'info' }
  },
}

