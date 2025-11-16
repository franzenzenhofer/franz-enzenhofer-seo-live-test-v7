import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const commonMobileSetupRule: Rule = {
  id: 'http:common-mobile-setup',
  name: 'Common mobile setup',
  enabled: true,
  what: 'http',
  async run(page) {
    const viewportEl = page.doc.querySelector('meta[name="viewport"]')
    const touchEl = page.doc.querySelector('link[rel~="apple-touch-icon"]')
    const viewport = !!viewportEl
    const touch = !!touchEl
    const ok = viewport
    const sourceHtml = extractHtml(viewportEl)
    return {
      label: 'HEAD',
      message: ok ? `Viewport present${touch ? ', apple-touch-icon present' : ''}` : 'Missing meta viewport',
      type: ok ? 'info' : 'warn',
      name: 'Common mobile setup',
      details: viewportEl
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(viewportEl),
          }
        : undefined,
    }
  },
}

