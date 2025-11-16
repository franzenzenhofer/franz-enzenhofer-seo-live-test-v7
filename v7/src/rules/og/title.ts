import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

export const ogTitleRule: Rule = {
  id: 'og-title',
  name: 'Open Graph Title',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const el = page.doc.querySelector(OG_SELECTORS.TITLE) as HTMLMetaElement|null
    if (!el || !el.content) {
      return { label: 'HEAD', message: 'No og:title meta.', type: 'info', name: 'Open Graph Title' }
    }
    const sourceHtml = extractHtml(el)
    return {
      label: 'HEAD',
      message: `og:title present (${el.content.length} chars)`,
      type: 'info',
      name: 'Open Graph Title',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), ogTitle: el.content },
    }
  },
}

