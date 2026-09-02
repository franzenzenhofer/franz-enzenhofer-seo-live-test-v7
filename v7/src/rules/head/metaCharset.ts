import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Charset'
const RULE_ID = 'head:meta-charset'
const SELECTOR = 'head > meta[charset]'
const HTTP_EQUIV_SELECTOR = 'head > meta[http-equiv="content-type" i][content]'

const charsetFromContentType = (value: string): string => {
  const match = /charset\s*=\s*"?([^";\s]+)/i.exec(value)
  return (match?.[1] || '').trim().toUpperCase()
}

type Declaration = { charset: string; source: 'meta-charset' | 'http-equiv' | 'header'; element: Element | null }

const findDeclaration = (page: { doc: Document; headers?: Record<string, string> }): Declaration | null => {
  const metaEl = page.doc.querySelector(SELECTOR)
  if (metaEl) {
    return { charset: (metaEl.getAttribute('charset') || '').trim().toUpperCase(), source: 'meta-charset', element: metaEl }
  }
  const httpEquivEl = page.doc.querySelector(HTTP_EQUIV_SELECTOR)
  const httpEquivCharset = charsetFromContentType(httpEquivEl?.getAttribute('content') || '')
  if (httpEquivEl && httpEquivCharset) {
    return { charset: httpEquivCharset, source: 'http-equiv', element: httpEquivEl }
  }
  const headerCharset = charsetFromContentType(page.headers?.['content-type'] || '')
  if (headerCharset) {
    return { charset: headerCharset, source: 'header', element: null }
  }
  return null
}

export const metaCharsetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-charset'],
    description: 'Checks the character encoding declaration (meta charset, meta http-equiv Content-Type, or Content-Type header): warn when absent or empty, ok for UTF-8, warn for any other value (WHATWG requires utf-8).',
  },
  async run(page) {
    const declaration = findDeclaration(page)
    const charset = declaration?.charset || ''
    const hasValue = charset.length > 0
    const isUTF8 = charset === 'UTF-8'

    let message = ''
    let type: 'ok' | 'warn' = 'warn'
    let priority = 100

    if (!declaration) {
      message = 'Missing character encoding declaration (no <meta charset>, http-equiv Content-Type, or Content-Type header charset).'
    } else if (!hasValue) {
      message = '<meta charset> present but value is empty.'
      priority = 150
    } else if (isUTF8) {
      message = `charset=UTF-8 (via ${declaration.source})`
      type = 'ok'
      priority = 800
    } else {
      message = `charset=${charset} (non-conforming; WHATWG requires UTF-8)`
      priority = 200
    }

    const element = declaration?.element ?? null
    const details = element
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(charset || '(empty)'),
          domPath: getDomPath(element),
          charset,
          isUTF8,
          charsetSource: declaration?.source,
        }
      : { charset, isUTF8, charsetSource: declaration?.source }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details,
    }
  },
}
