import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const metaViewportRule: Rule = {
  id: 'head:meta-viewport',
  name: 'Meta Viewport',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector('meta[name="viewport"]')
    if (!m) return { name: 'Meta Viewport', label: 'HEAD', message: 'Missing meta viewport', type: 'warn' }
    const sourceHtml = extractHtml(m)
    const c = (m.getAttribute('content') || '').toLowerCase()
    const ok = c.includes('width=device-width') && (c.includes('initial-scale=1') || c.includes('initial-scale=1.0'))
    return {
      name: 'Meta Viewport',
      label: 'HEAD',
      message: ok ? 'Viewport OK' : 'Viewport content may be suboptimal',
      type: ok ? 'ok' : 'warn',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(m),
      },
    }
  },
}

