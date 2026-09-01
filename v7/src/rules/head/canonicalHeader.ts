import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'

const LABEL = 'HEAD'
const NAME = 'Canonical HTTP header'
const RULE_ID = 'head:canonical-header'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const headerVal = linkHeaderOf(page.headers)
    const canonicals = parseHeaderCanonicals(headerVal)
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
