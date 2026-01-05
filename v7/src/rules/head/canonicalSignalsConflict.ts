import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl } from '@/shared/url-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical signals conflict'
const RULE_ID = 'head:canonical-signals-conflict'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const parseHeaderCanonicals = (val: string | undefined | null): string[] => {
  if (!val) return []
  const matches = [...val.matchAll(/<([^>]+)>\s*;\s*rel="?canonical"?/gi)]
  const urls = matches.map((m) => m[1]).filter((u): u is string => !!u)
  return Array.from(new Set(urls))
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
    const headerCanonicals = parseHeaderCanonicals(headerVal)

    if (headerCanonicals.length > 1) {
      return {
        label: LABEL,
        name: NAME,
        message: `Multiple rel="canonical" HTTP headers found (${headerCanonicals.length}); remove duplicates.`,
        type: 'error',
        priority: 100,
        details: { header: headerVal, headerCanonicals, reference: SPEC },
      }
    }
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
        ? 'Both HTML and HTTP canonicals set; remove one source to avoid conflicts.'
        : 'HTML and HTTP canonicals conflict; they point to different URLs.',
      type: 'error',
      priority: matches ? 150 : 80,
      details: {
        htmlCanonical,
        headerCanonical,
        headerCanonicals: headerCanonicals.length ? headerCanonicals : undefined,
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
