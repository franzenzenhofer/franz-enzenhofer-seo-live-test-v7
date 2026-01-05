import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'DOM'
const NAME = 'Parameterized links (static vs idle)'
const RULE_ID = 'dom:parameterized-links-diff'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

type ParamLink = { url: string; domPath: string }

const collectParamLinks = (doc?: Document, base?: URL): ParamLink[] => {
  if (!doc || !base) return []
  const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'))
  return anchors
    .map((a) => ({ href: a.getAttribute('href') || '', el: a }))
    .filter((entry) => entry.href.includes('?'))
    .map((entry) => {
      try {
        const u = entry.href.startsWith('http') ? new URL(entry.href) : new URL(entry.href, base)
        if (u.host !== base.host) return null
        u.hash = ''
        return { url: u.href, domPath: getDomPath(entry.el) }
      } catch {
        return null
      }
    })
    .filter((u): u is ParamLink => !!u)
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
    const staticUrls = staticLinks.map((link) => link.url)
    const idleUrls = idleLinks.map((link) => link.url)

    if (!page.domIdleDoc) {
      return {
        label: LABEL,
        name: NAME,
        message: `No idle DOM snapshot. Static parameterized links: ${staticLinks.length}.`,
        type: 'info',
        priority: 900,
        details: { staticLinks: staticUrls, idleLinks: [], reference: SPEC },
      }
    }

    const staticOnly = staticLinks.filter((l) => !idleUrls.includes(l.url))
    const idleOnly = idleLinks.filter((l) => !staticUrls.includes(l.url))
    const hasDiff = staticOnly.length || idleOnly.length
    const domPaths = [...staticOnly, ...idleOnly].map((link) => link.domPath).filter(Boolean)
    const domPathColors = [
      ...staticOnly.map(() => '#f97316'),
      ...idleOnly.map(() => '#2563eb'),
    ]

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
        staticOnly: staticOnly.map((link) => link.url),
        idleOnly: idleOnly.map((link) => link.url),
        domPaths,
        domPathColors,
        reference: SPEC,
      },
    }
  },
}
