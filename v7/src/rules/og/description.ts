import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

export const ogDescriptionRule: Rule = {
  id: 'og:description',
  name: 'Open Graph Description',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.DESCRIPTION)
    if (!m) return { label: 'OG', message: 'Missing og:description', type: 'warn', name: 'Open Graph Description' }
    const c = m.getAttribute('content')?.trim() || ''
    if (!c) return { label: 'OG', message: 'Empty og:description', type: 'warn', name: 'Open Graph Description' }
    const sourceHtml = extractHtml(m)
    return {
      label: 'OG',
      message: `og:description present (${c.length} chars)`,
      type: 'info',
      name: 'Open Graph Description',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogDescription: c },
    }
  },
}

