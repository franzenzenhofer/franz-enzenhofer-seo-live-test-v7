import { OG_SELECTORS } from './og-constants'

import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { isAbsoluteUrl } from '@/shared/url-utils'
import type { Rule } from '@/core/types'

const TESTED = 'Checked <meta property="og:url"> presence and captured canonical URL value.'

const resolveUrl = (value: string, base?: string): string | null => {
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

export const ogUrlRule: Rule = {
  id: 'og:url',
  name: 'Open Graph URL',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks og:url presence, absoluteness, and consistency with rel=canonical and the document URL.',
  },
  async run(page) {
    const m = page.doc.querySelector(OG_SELECTORS.URL)
    if (!m) return { label: 'HEAD', message: 'Missing og:url', type: 'warn', priority: 500, name: 'Open Graph URL', details: { tested: TESTED } }
    const content = m.getAttribute('content')?.trim() || ''
    const sourceHtml = extractHtml(m)
    if (!content) {
      return { label: 'HEAD', message: 'Empty og:url', type: 'warn', priority: 400, name: 'Open Graph URL', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), tested: TESTED } }
    }
    const ogResolved = isAbsoluteUrl(content) ? resolveUrl(content) : null
    if (!ogResolved) {
      return { label: 'HEAD', message: 'og:url not absolute', type: 'warn', priority: 350, name: 'Open Graph URL', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogUrl: content, tested: TESTED } }
    }

    const canonical = page.doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href')?.trim() || ''
    const canonicalResolved = canonical ? resolveUrl(canonical, page.url) || '' : ''
    const pageResolved = page.url ? resolveUrl(page.url) || page.url : ''

    let message = 'og:url present and consistent.'
    let type: 'info' | 'warn' = 'info'

    if (canonicalResolved && canonicalResolved !== ogResolved) {
      message = 'og:url does not equal the canonical URL.'
      type = 'warn'
    } else if (pageResolved && pageResolved !== ogResolved) {
      message = 'og:url does not equal the document location.'
      type = 'warn'
    }

    return {
      label: 'HEAD',
      message,
      type,
      priority: type === 'warn' ? 300 : 760,
      name: 'Open Graph URL',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(m),
        ogUrl: ogResolved,
        canonical: canonicalResolved || null,
        pageUrl: page.url,
        tested: TESTED,
      },
    }
  },
}
