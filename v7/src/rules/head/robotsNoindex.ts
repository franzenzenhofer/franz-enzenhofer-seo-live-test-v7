import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const robotsNoindexRule: Rule = {
  id: 'head:robots-noindex',
  name: 'Meta robots noindex',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector('meta[name="robots"]')
    if (!m) return { name: 'Meta robots noindex', label: 'HEAD', message: 'No robots meta', type: 'info' }
    const sourceHtml = extractHtml(m)
    const c = (m.getAttribute('content') || '').toLowerCase()
    const noindex = /\bnoindex\b/.test(c)
    return {
      name: 'Meta robots noindex',
      label: 'HEAD',
      message: noindex ? 'robots: noindex' : 'robots: indexable',
      type: noindex ? 'warn' : 'ok',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(m),
      },
    }
  },
}

