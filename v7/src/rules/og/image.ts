import { OG_SELECTORS } from './og-constants'

import { isAbsoluteUrl } from '@/shared/url-utils'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const SPEC = 'https://ogp.me/#metadata'
const TESTED = 'Checked <meta property="og:image"> presence and whether URL is absolute.'

export const ogImageRule: Rule = {
  id: 'og:image',
  name: 'Open Graph Image',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.IMAGE)
    if (!m) return { label: 'OG', message: 'Missing og:image', type: 'warn', name: 'Open Graph Image', details: { tested: TESTED, reference: SPEC } }
    const c = (m.getAttribute('content') || '').trim()
    const abs = isAbsoluteUrl(c)
    const sourceHtml = extractHtml(m)
    return abs
      ? { label: 'OG', message: 'og:image present (absolute URL)', type: 'info', name: 'Open Graph Image', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogImage: c, tested: TESTED, reference: SPEC } }
      : { label: 'OG', message: 'og:image not absolute', type: 'warn', name: 'Open Graph Image', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogImage: c, tested: TESTED, reference: SPEC } }
  },
}
