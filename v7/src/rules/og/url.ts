import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { isAbsoluteUrl } from '@/shared/url-utils'
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
    if (!m) return { label: 'HEAD', message: 'Missing og:url', type: 'warn', name: 'Open Graph URL', details: { tested: TESTED, reference: SPEC } }
    const content = m.getAttribute('content')?.trim() || ''
    const sourceHtml = extractHtml(m)
    if (!content) {
      return { label: 'HEAD', message: 'Empty og:url', type: 'warn', name: 'Open Graph URL', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), tested: TESTED, reference: SPEC } }
    }
    if (!isAbsoluteUrl(content)) {
      return { label: 'HEAD', message: 'og:url not absolute', type: 'warn', name: 'Open Graph URL', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogUrl: content, tested: TESTED, reference: SPEC } }
    }

    const canonical = page.doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href')?.trim() || ''
    const canonicalResolved = canonical ? new URL(canonical, page.url).toString() : ''
    const ogUrl = content
    const pageUrl = page.url

    let message = `Open Graph (Facebook) URL: ${ogUrl}`
    let type: 'info' | 'warn' = 'info'

    if (canonicalResolved && canonicalResolved !== ogUrl) {
      message = `Open Graph URL does not equal canonical (${canonicalResolved}).`
      type = 'warn'
    } else if (pageUrl && pageUrl !== ogUrl) {
      message = `Open Graph URL does not equal document location (${pageUrl}).`
      type = 'warn'
    } else {
      message += ' (OK)'
    }

    return {
      label: 'HEAD',
      message,
      type,
      name: 'Open Graph URL',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(m),
        ogUrl,
        canonical: canonicalResolved || null,
        pageUrl,
        tested: TESTED,
        reference: SPEC,
      },
    }
  },
}
