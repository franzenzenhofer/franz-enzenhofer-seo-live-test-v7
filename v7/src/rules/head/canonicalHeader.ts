import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical HTTP header'
const RULE_ID = 'head:canonical-header'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const parseCanonicalHeaders = (val: string | undefined | null): string[] => {
  if (!val) return []
  const matches = [...val.matchAll(/<([^>]+)>\s*;\s*rel="?canonical"?/gi)]
  const urls = matches.map((m) => m[1]).filter((u): u is string => !!u)
  return Array.from(new Set(urls))
}

export const canonicalHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const headerVal = page.headers?.['link'] || page.headers?.['Link'] || ''
    const canonicals = parseCanonicalHeaders(headerVal)
    if (!canonicals.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No rel="canonical" HTTP header found.',
        type: 'info',
        priority: 600,
        details: { reference: SPEC },
      }
    }
    if (canonicals.length > 1) {
      return {
        label: LABEL,
        name: NAME,
        message: `Multiple rel="canonical" HTTP headers found (${canonicals.length}); keep exactly one.`,
        type: 'error',
        priority: 120,
        details: { header: headerVal, canonicalUrls: canonicals, snippet: extractSnippet(headerVal), reference: SPEC },
      }
    }
    const canonical = canonicals[0]
    return {
      label: LABEL,
      name: NAME,
      message: `Canonical HTTP header found: ${canonical}`,
      type: 'ok',
      priority: 800,
      details: {
        header: headerVal,
        canonicalUrl: canonical,
        snippet: extractSnippet(headerVal),
        reference: SPEC,
      },
    }
  },
}
