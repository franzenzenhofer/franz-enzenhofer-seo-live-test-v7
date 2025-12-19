import type { Rule } from '@/core/types'
import { extractSnippet, getDomPath } from '@/shared/html-utils'
import { normalizeUrl } from '@/shared/url-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical signals conflict'
const RULE_ID = 'head:canonical-signals-conflict'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const parseHeaderCanonical = (val: string | undefined | null) => {
  if (!val) return null
  const m = /<([^>]+)>\s*;\s*rel="?canonical"?/i.exec(val)
  return m ? m[1] : null
}

export const canonicalSignalsConflictRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const htmlHref = (linkEl?.getAttribute('href') || '').trim()
    const htmlCanonical = htmlHref ? new URL(htmlHref, page.url).toString() : ''
    const headerVal = page.headers?.['link'] || page.headers?.['Link'] || ''
    const headerCanonical = parseHeaderCanonical(headerVal)

    if (!headerCanonical || !htmlCanonical) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Single canonical source present (no conflict detected).',
        type: 'info',
        priority: 700,
        details: {
          htmlCanonical: htmlCanonical || null,
          headerCanonical: headerCanonical || null,
          reference: SPEC,
          domPath: linkEl ? getDomPath(linkEl) : undefined,
        },
      }
    }

    const normalizedHtml = normalizeUrl(htmlCanonical)
    const normalizedHeader = normalizeUrl(headerCanonical)
    const matches = normalizedHtml === normalizedHeader
    return {
      label: LABEL,
      name: NAME,
      message: matches
        ? 'Both HTML and HTTP canonical set; remove one to avoid conflicts.'
        : 'HTML and HTTP canonical conflict; they point to different URLs.',
      type: matches ? 'warn' : 'error',
      priority: matches ? 300 : 100,
      details: {
        htmlCanonical,
        headerCanonical,
        normalizedHtml,
        normalizedHeader,
        domPath: linkEl ? getDomPath(linkEl) : undefined,
        header: headerVal,
        snippet: linkEl ? extractSnippet(linkEl.outerHTML) : extractSnippet(htmlCanonical),
        reference: SPEC,
      },
    }
  },
}
