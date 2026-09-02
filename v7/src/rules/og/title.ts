import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import type { Rule } from '@/core/types'

const TESTED = 'Checked <meta property="og:title"> content presence and length.'

export const ogTitleRule: Rule = {
  id: 'og-title',
  name: 'Open Graph Title',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks <meta property="og:title"> presence and reports its content length as info.',
  },
  run: async (page) => {
    const el = page.doc.querySelector(OG_SELECTORS.TITLE) as HTMLMetaElement|null
    if (!el || !el.content) {
      return { label: 'HEAD', message: 'Missing og:title', type: 'warn', priority: 500, name: 'Open Graph Title', details: { tested: TESTED } }
    }
    const sourceHtml = extractHtml(el)
    return {
      label: 'HEAD',
      message: `og:title present (${el.content.length} characters).`,
      type: 'info',
      priority: 760,
      name: 'Open Graph Title',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), ogTitle: el.content, tested: TESTED },
    }
  },
}
