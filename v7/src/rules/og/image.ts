import { OG_SELECTORS } from './og-constants'

import { isAbsoluteUrl } from '@/shared/url-utils'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
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
    if (!m) return { label: 'HEAD', message: 'Missing og:image', type: 'warn', priority: 500, name: 'Open Graph Image', details: { tested: TESTED, reference: SPEC } }
    const c = (m.getAttribute('content') || '').trim()
    const abs = isAbsoluteUrl(c)
    const sourceHtml = extractHtml(m)
    return abs
      ? { label: 'HEAD', message: 'og:image present (absolute URL).', type: 'info', priority: 760, name: 'Open Graph Image', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogImage: c, tested: TESTED, reference: SPEC } }
      : { label: 'HEAD', message: 'og:image present but not an absolute URL.', type: 'warn', priority: 350, name: 'Open Graph Image', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogImage: c, tested: TESTED, reference: SPEC } }
  },
}
