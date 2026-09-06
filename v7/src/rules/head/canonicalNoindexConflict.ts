import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'

const LABEL = 'HEAD'
const NAME = 'Canonical + noindex conflict'
const RULE_ID = 'head:canonical-noindex-conflict'

export const canonicalNoindexConflictRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
    ],
    description: 'Warns when a canonical (HTML or HTTP header) coexists with noindex (meta robots or X-Robots-Tag) - conflicting signals.',
  },
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const htmlCanonical = (linkEl?.getAttribute('href') || '').trim()
    const headerCanonicals = parseHeaderCanonicals(linkHeaderOf(page.headers))
    const hasCanonical = !!htmlCanonical || headerCanonicals.length > 0

    // Meta names are case-insensitive to Google, and crawler-scoped metas
    // (name="googlebot") carry the same rules as name="robots".
    const robotsMeta = page.doc.querySelector('head > meta[name="robots" i], head > meta[name="googlebot" i]')
    const effective = pageEffectiveRobots(page)
    const hasNoindexMeta = effective.directives.some((directive) => directive.source === 'meta' && directive.hasNoindex)
    const xRobotsRaw = page.headers?.['x-robots-tag'] || ''
    const hasNoindexHeader = effective.directives.some((directive) => directive.source === 'header' && directive.hasNoindex)

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
          effective,
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
        ...(htmlCanonical ? { htmlCanonical } : {}),
        ...(headerCanonicals.length ? { headerCanonicals } : {}),
        hasCanonical,
        hasNoindex,
        effective,
        robotsMetaPresent: !!robotsMeta,
      },
    }
  },
}
