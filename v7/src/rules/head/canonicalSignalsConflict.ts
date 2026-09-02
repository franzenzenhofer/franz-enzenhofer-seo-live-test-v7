import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl } from '@/shared/url-utils'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'

const LABEL = 'HEAD'
const NAME = 'Canonical signals conflict'
const RULE_ID = 'head:canonical-signals-conflict'

export const canonicalSignalsConflictRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://www.rfc-editor.org/rfc/rfc6596',
    ],
    description: 'Compares HTML link canonical against HTTP header canonical: error when they point to different URLs, warn when both sources are set to the same URL.',
  },
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const htmlHref = (linkEl?.getAttribute('href') || '').trim()
    const htmlCanonical = htmlHref ? new URL(htmlHref, page.url).toString() : ''
    const headerVal = linkHeaderOf(page.headers)
    // Multiple header canonicals are head:canonical-header's finding; compare
    // against the first one here to avoid double-reporting the same defect.
    const headerCanonicals = parseHeaderCanonicals(headerVal)
    const headerCanonical = headerCanonicals[0] || ''

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
          domPath: linkEl ? getDomPath(linkEl) : undefined,
        },
      }
    }

    const normalizedHtml = normalizeUrl(htmlCanonical)
    const normalizedHeader = normalizeUrl(headerCanonical)
    const matches = normalizedHtml === normalizedHeader
    // Google: using both methods at once is supported but "more error prone" -
    // a matching pair is a recommendation-level warn, differing URLs an error.
    return {
      label: LABEL,
      name: NAME,
      message: matches
        ? 'Both HTML and HTTP canonicals set to the same URL; choose one method to reduce error risk.'
        : 'HTML and HTTP canonicals conflict; they point to different URLs.',
      type: matches ? 'warn' : 'error',
      priority: matches ? 300 : 80,
      details: {
        htmlCanonical,
        headerCanonical,
        headerCanonicals: headerCanonicals.length ? headerCanonicals : undefined,
        normalizedHtml,
        normalizedHeader,
        domPath: linkEl ? getDomPath(linkEl) : undefined,
        header: headerVal,
        snippet: linkEl ? extractSnippet(linkEl.outerHTML) : extractSnippet(htmlCanonical),
      },
    }
  },
}
