import type { Rule } from '@/core/types'

const LABEL = 'DOM'
const NAME = 'Parameterized links (static vs idle)'
const RULE_ID = 'dom:parameterized-links-diff'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const collectParamLinks = (doc?: Document, base?: URL) => {
  if (!doc || !base) return []
  const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'))
  return anchors
    .map((a) => a.getAttribute('href') || '')
    .filter((h) => h.includes('?'))
    .map((href) => {
      try {
        const u = href.startsWith('http') ? new URL(href) : new URL(href, base)
        if (u.host !== base.host) return null
        u.hash = ''
        return u.href
      } catch {
        return null
      }
    })
    .filter((u): u is string => !!u)
}

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
    const staticLinks = collectParamLinks(page.doc, base)
    const idleLinks = collectParamLinks(page.domIdleDoc, base)

    if (!page.domIdleDoc) {
      return {
        label: LABEL,
        name: NAME,
        message: `No idle DOM snapshot. Static parameterized links: ${staticLinks.length}.`,
        type: 'info',
        priority: 900,
        details: { staticLinks, idleLinks: [], reference: SPEC },
      }
    }

    const staticOnly = staticLinks.filter((l) => !idleLinks.includes(l))
    const idleOnly = idleLinks.filter((l) => !staticLinks.includes(l))
    const hasDiff = staticOnly.length || idleOnly.length

    return {
      label: LABEL,
      name: NAME,
      message: hasDiff
        ? `Parameterized link differences: ${staticOnly.length} only in static, ${idleOnly.length} only in idle.`
        : 'Parameterized links consistent between static and idle DOM.',
      type: hasDiff ? 'warn' : 'ok',
      priority: hasDiff ? 250 : 850,
      details: { staticLinks, idleLinks, staticOnly, idleOnly, reference: SPEC },
    }
  },
}
