import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import type { Rule } from '@/core/types'

const TESTED = 'Checked <meta property="og:description"> presence and captured content.'

export const ogDescriptionRule: Rule = {
  id: 'og:description',
  name: 'Open Graph Description',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks <meta property="og:description"> presence: info when missing, warn when present but empty.',
  },
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.DESCRIPTION)
    if (!m) return { label: 'HEAD', message: 'Missing og:description', type: 'info', priority: 900, name: 'Open Graph Description', details: { tested: TESTED } }
    const c = m.getAttribute('content')?.trim() || ''
    if (!c) return { label: 'HEAD', message: 'Empty og:description', type: 'warn', priority: 400, name: 'Open Graph Description', details: { tested: TESTED } }
    const sourceHtml = extractHtml(m)
    return {
      label: 'HEAD',
      message: `og:description present (${c.length} characters).`,
      type: 'info',
      priority: 760,
      name: 'Open Graph Description',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogDescription: c, tested: TESTED },
    }
  },
}
