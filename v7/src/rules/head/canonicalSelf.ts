import { normalizeUrl } from '@/shared/url-utils'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

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
    const a = normalizeUrl(page.url)
    const b = normalizeUrl(new URL(href, page.url).toString())
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

