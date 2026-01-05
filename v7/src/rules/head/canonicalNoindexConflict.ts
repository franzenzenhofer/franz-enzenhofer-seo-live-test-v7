import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Canonical + noindex conflict'
const RULE_ID = 'head:canonical-noindex-conflict'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
const ROBOTS_SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'

const parseTokens = (val: string | undefined | null) =>
  (val || '')
    .toLowerCase()
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)

const parseHeaderCanonicals = (val: string | undefined | null): string[] => {
  if (!val) return []
  const matches = [...val.matchAll(/<([^>]+)>\s*;\s*rel="?canonical"?/gi)]
  const urls = matches.map((m) => m[1]).filter((u): u is string => !!u)
  return Array.from(new Set(urls))
}

export const canonicalNoindexConflictRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const htmlCanonical = (linkEl?.getAttribute('href') || '').trim()
    const headerCanonicals = parseHeaderCanonicals(page.headers?.['link'] || page.headers?.['Link'])
    const hasCanonical = !!htmlCanonical || headerCanonicals.length > 0

    const robotsMeta = page.doc.querySelector('head > meta[name="robots"]')
    const robotsTokens = parseTokens(robotsMeta?.getAttribute('content'))
    const hasNoindexMeta = robotsTokens.includes('noindex')

    const xRobotsRaw = page.headers?.['x-robots-tag'] || ''
    const xRobotsTokens = parseTokens(xRobotsRaw)
    const hasNoindexHeader = xRobotsTokens.includes('noindex')

    const hasNoindex = hasNoindexMeta || hasNoindexHeader

    if (hasCanonical && hasNoindex) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Canonical present but page is noindex; Google may ignore the canonical (conflicting signals).',
        type: 'warn',
        priority: 160,
        details: {
          htmlCanonical: htmlCanonical || null,
          headerCanonicals: headerCanonicals.length ? headerCanonicals : null,
          robotsMeta: robotsMeta ? robotsMeta.outerHTML : null,
          robotsDomPath: robotsMeta ? getDomPath(robotsMeta) : null,
          xRobots: xRobotsRaw || null,
          hasNoindexMeta,
          hasNoindexHeader,
          reference: SPEC,
          secondaryReference: ROBOTS_SPEC,
          snippet: extractSnippet(robotsMeta?.outerHTML || xRobotsRaw || ''),
        },
      }
    }

    return {
      label: LABEL,
      name: NAME,
      message: 'No canonical/noindex conflict detected.',
      type: 'info',
      priority: 900,
      details: {
        reference: SPEC,
        hasCanonical,
        hasNoindex,
        robotsMetaPresent: !!robotsMeta,
        headerCanonicalsCount: headerCanonicals.length,
      },
    }
  },
}
