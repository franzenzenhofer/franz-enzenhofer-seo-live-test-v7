import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const SPEC = 'https://ogp.me/#metadata'
const TESTED = 'Checked <meta property="og:description"> presence and captured content.'

export const ogDescriptionRule: Rule = {
  id: 'og:description',
  name: 'Open Graph Description',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.DESCRIPTION)
    if (!m) return { label: 'HEAD', message: 'Missing og:description', type: 'info', name: 'Open Graph Description', details: { tested: TESTED, reference: SPEC } }
    const c = m.getAttribute('content')?.trim() || ''
    if (!c) return { label: 'HEAD', message: 'Empty og:description', type: 'warn', name: 'Open Graph Description', details: { tested: TESTED, reference: SPEC } }
    const sourceHtml = extractHtml(m)
    return {
      label: 'HEAD',
      message: `Open Graph (Facebook) description: "${c}"`,
      type: 'info',
      name: 'Open Graph Description',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogDescription: c, tested: TESTED, reference: SPEC },
    }
  },
}
