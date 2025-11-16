import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

export const ogUrlRule: Rule = {
  id: 'og:url',
  name: 'Open Graph URL',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.URL)
    if (!m) return { label: 'OG', message: 'Missing og:url', type: 'warn', name: 'ogUrl' }
    const c = m.getAttribute('content')?.trim() || ''
    const sourceHtml = extractHtml(m)
    return c
      ? { label: 'OG', message: 'og:url present', type: 'info', name: 'ogUrl', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogUrl: c } }
      : { label: 'OG', message: 'Empty og:url', type: 'warn', name: 'ogUrl', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m) } }
  },
}

