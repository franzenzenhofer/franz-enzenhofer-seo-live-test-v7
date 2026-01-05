import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import type { Rule } from '@/core/types'

const SPEC = 'https://ogp.me/#metadata'
const TESTED = 'Checked <meta property="og:title"> content presence and length.'

export const ogTitleRule: Rule = {
  id: 'og-title',
  name: 'Open Graph Title',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const el = page.doc.querySelector(OG_SELECTORS.TITLE) as HTMLMetaElement|null
    if (!el || !el.content) {
      return { label: 'HEAD', message: 'No og:title meta.', type: 'info', name: 'Open Graph Title', details: { tested: TESTED, reference: SPEC } }
    }
    const sourceHtml = extractHtml(el)
    return {
      label: 'HEAD',
      message: `Open Graph (Facebook) title: "${el.content}"`,
      type: 'info',
      name: 'Open Graph Title',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), ogTitle: el.content, tested: TESTED, reference: SPEC },
    }
  },
}
