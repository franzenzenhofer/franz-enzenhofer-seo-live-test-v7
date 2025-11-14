import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const canonicalRule: Rule = {
  id: 'head-canonical',
  name: 'Canonical Link',
  enabled: true,
  run: async (page) => {
    const el = page.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement|null
    if (!el || !el.href) {
      return {
        label: 'HEAD',
        message: 'No canonical link found.',
        type: 'error',
        name: 'canonical',
      }
    }
    const sourceHtml = extractHtml(el)
    return {
      label: 'HEAD',
      message: 'Canonical link present',
      type: 'info',
      name: 'canonical',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(el),
        canonicalUrl: el.href,
      },
    }
  },
}

