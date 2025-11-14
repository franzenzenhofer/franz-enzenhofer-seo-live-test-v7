import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const ogTitleRule: Rule = {
  id: 'og-title',
  name: 'Open Graph Title',
  enabled: true,
  run: async (page) => {
    const el = page.doc.querySelector('meta[property="og:title"]') as HTMLMetaElement|null
    if (!el || !el.content) {
      return { label: 'HEAD', message: 'No og:title meta.', type: 'info', name: 'ogTitle' }
    }
    const sourceHtml = extractHtml(el)
    return {
      label: 'HEAD',
      message: `OG title: ${el.content}`,
      type: 'info',
      name: 'ogTitle',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
    }
  },
}

