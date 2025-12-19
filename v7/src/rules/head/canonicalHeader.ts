import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical HTTP header'
const RULE_ID = 'head:canonical-header'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const parseCanonicalHeader = (val: string | undefined | null): string | null => {
  if (!val) return null
  const match = /<([^>]+)>\s*;\s*rel="?canonical"?/i.exec(val)
  return match?.[1] || null
}

export const canonicalHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const headerVal = page.headers?.['link'] || page.headers?.['Link'] || ''
    const canonical = parseCanonicalHeader(headerVal)
    if (!canonical) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No rel="canonical" HTTP header found.',
        type: 'info',
        priority: 600,
        details: { reference: SPEC },
      }
    }
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
