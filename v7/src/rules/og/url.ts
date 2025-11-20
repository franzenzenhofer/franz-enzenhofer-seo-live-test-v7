import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const SPEC = 'https://ogp.me/#metadata'
const TESTED = 'Checked <meta property="og:url"> presence and captured canonical URL value.'

export const ogUrlRule: Rule = {
  id: 'og:url',
  name: 'Open Graph URL',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.URL)
    if (!m) return { label: 'OG', message: 'Missing og:url', type: 'warn', name: 'Open Graph URL', details: { tested: TESTED, reference: SPEC } }
    const c = m.getAttribute('content')?.trim() || ''
    const sourceHtml = extractHtml(m)
    return c
      ? { label: 'OG', message: 'og:url present', type: 'info', name: 'Open Graph URL', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogUrl: c, tested: TESTED, reference: SPEC } }
      : { label: 'OG', message: 'Empty og:url', type: 'warn', name: 'Open Graph URL', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), tested: TESTED, reference: SPEC } }
  },
}
