import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const canonicalAbsoluteRule: Rule = {
  id: 'head:canonical-absolute',
  name: 'Canonical absolute URL',
  enabled: true,
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel="canonical"]')
    const href = linkEl?.getAttribute('href') || ''
    if (!href) return { name: 'Canonical absolute URL', label: 'HEAD', message: 'No canonical link', type: 'info' }
    const sourceHtml = linkEl ? extractHtml(linkEl) : ''
    try {
      new URL(href, page.url)
      const isAbsolute = href.startsWith('http')
      return {
        name: 'Canonical absolute URL',
        label: 'HEAD',
        message: isAbsolute ? 'Canonical absolute' : 'Canonical is relative',
        type: isAbsolute ? 'ok' : 'warn',
        details: linkEl
          ? {
              sourceHtml,
              snippet: extractSnippet(sourceHtml),
              domPath: getDomPath(linkEl),
            }
          : undefined,
      }
    } catch {
      return {
        name: 'Canonical absolute URL',
        label: 'HEAD',
        message: 'Invalid canonical URL',
        type: 'warn',
        details: linkEl
          ? {
              sourceHtml,
              snippet: extractSnippet(sourceHtml),
              domPath: getDomPath(linkEl),
            }
          : undefined,
      }
    }
  },
}
