import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const norm = (u: string) => {
  try {
    const x = new URL(u)
    x.hash = ''
    x.search = ''
    x.pathname = x.pathname.replace(/\/index\.(html?)$/i, '/').replace(/([^/])$/, '$1')
    if (x.pathname !== '/' && x.pathname.endsWith('/')) x.pathname = x.pathname.slice(0, -1)
    x.hostname = x.hostname.toLowerCase()
    return x.toString()
  } catch {
    return u
  }
}

export const canonicalSelfRule: Rule = {
  id: 'head:canonical-self',
  name: 'Canonical self-referential',
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel="canonical"]')
    const href = linkEl?.getAttribute('href') || ''
    if (!href) return { name: 'Canonical self-referential', label: 'HEAD', message: 'No canonical', type: 'info' }
    const sourceHtml = linkEl ? extractHtml(linkEl) : ''
    const a = norm(page.url)
    const b = norm(new URL(href, page.url).toString())
    const isSelf = a === b
    return {
      name: 'Canonical self-referential',
      label: 'HEAD',
      message: isSelf ? 'Canonical matches URL' : `Canonical differs (${b})`,
      type: isSelf ? 'ok' : 'info',
      details: linkEl
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(linkEl),
          }
        : undefined,
    }
  },
}

