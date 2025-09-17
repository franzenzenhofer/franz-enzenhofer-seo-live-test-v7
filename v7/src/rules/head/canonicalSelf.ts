import type { Rule } from '@/core/types'

const norm = (u: string) => {
  try {
    const x = new URL(u)
    x.hash = ''
    x.search = ''
    x.pathname = x.pathname.replace(/\/index\.(html?)$/i, '/').replace(/([^/])$/, '$1')
    if (x.pathname !== '/' && x.pathname.endsWith('/')) x.pathname = x.pathname.slice(0, -1)
    x.hostname = x.hostname.toLowerCase()
    return x.toString()
  } catch { return u }
}

export const canonicalSelfRule: Rule = {
  id: 'head:canonical-self',
  name: 'Canonical self-referential',
  enabled: true,
  async run(page) {
    const href = page.doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    if (!href) return { label: 'HEAD', message: 'No canonical', type: 'info' }
    const a = norm(page.url)
    const b = norm(new URL(href, page.url).toString())
    return a === b ? { label: 'HEAD', message: 'Canonical matches URL', type: 'ok' } : { label: 'HEAD', message: `Canonical differs (${b})`, type: 'info' }
  },
}

