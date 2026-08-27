import type { Rule } from '@/core/types'

const LABEL = 'DOM'
const NAME = 'Parameterized links (static vs idle)'
const RULE_ID = 'dom:parameterized-links-diff'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const normalize = (hrefs: string[], base: URL) => hrefs.flatMap((href) => {
  try {
    const url = new URL(href, base)
    if (url.host !== base.host) return []
    url.hash = ''
    return [url.href]
  } catch { return [] }
})

export const parameterizedLinksDiffRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    let base: URL
    try {
      base = new URL(page.url)
    } catch {
      return { label: LABEL, name: NAME, message: 'Invalid page URL', type: 'runtime_error', priority: 10, details: { reference: SPEC } }
    }
    if (!page.staticFacts || !page.idleFacts) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Static and idle DOM facts are required for an exact comparison.',
        type: 'runtime_error',
        priority: 900,
        details: { staticAvailable: !!page.staticFacts, idleAvailable: !!page.idleFacts, reference: SPEC },
      }
    }
    if (page.staticFacts.parameterizedLinksTruncated || page.idleFacts.parameterizedLinksTruncated) {
      return {
        label: LABEL, name: NAME, type: 'runtime_error', priority: 900,
        message: 'Parameterized-link comparison unavailable because exact phase evidence exceeded the bounded contract.',
        details: {
          staticTotal: page.staticFacts.parameterizedLinkCount,
          idleTotal: page.idleFacts.parameterizedLinkCount,
          truncated: true,
          reference: SPEC,
        },
      }
    }
    const staticUrls = normalize(page.staticFacts.parameterizedLinks, base)
    const idleUrls = normalize(page.idleFacts.parameterizedLinks, base)

    const staticOnly = staticUrls.filter((url) => !idleUrls.includes(url))
    const idleOnly = idleUrls.filter((url) => !staticUrls.includes(url))
    const hasDiff = staticOnly.length || idleOnly.length

    return {
      label: LABEL,
      name: NAME,
      message: hasDiff
        ? `Parameterized link differences: ${staticOnly.length} only in static, ${idleOnly.length} only in idle.`
        : 'Parameterized links consistent between static and idle DOM.',
      type: hasDiff ? 'warn' : 'ok',
      priority: hasDiff ? 250 : 850,
      details: {
        staticLinks: staticUrls,
        idleLinks: idleUrls,
        staticOnly,
        idleOnly,
        reference: SPEC,
      },
    }
  },
}
