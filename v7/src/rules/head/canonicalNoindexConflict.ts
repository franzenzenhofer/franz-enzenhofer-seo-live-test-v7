import { canonicalRows, hrefField, markupReason, overviewMarkup, resolveUrl, webUrlField } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import type { RobotsDirective } from '@/shared/robots.types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Canonical + noindex conflict'
const RULE_ID = 'head:canonical-noindex-conflict'
const CANONICAL_SELECTOR = 'link[rel~="canonical" i]'
const ROBOTS_SELECTOR = 'head > meta[name="robots" i], head > meta[name="googlebot" i]'
const checked = [
  textField('Canonical selector', CANONICAL_SELECTOR),
  textField('Robots selector', ROBOTS_SELECTOR),
  textField('Selection', 'First match per selector'),
  textField('Headers', 'Link and X-Robots-Tag response headers'),
  textField('Crawler', 'Googlebot'),
  textField('Criterion', 'A canonical source and an applicable noindex or none instruction'),
]
// Where an instruction came from, as the SEO names it: "meta robots", "meta googlebot", "X-Robots-Tag googlebot".
const sourceOf = (directive: RobotsDirective) => directive.source === 'meta' ? `meta ${directive.ua}` : `X-Robots-Tag${directive.ua === 'robots' ? '' : ` ${directive.ua}`}`
// Every applicable instruction as one detail row, numbered only when a source repeats.
const instructionRows = (directives: RobotsDirective[]): DisplayField[] => {
  const seen = new Map<string, number>()
  return directives.map((directive) => {
    const source = sourceOf(directive)
    const count = (seen.get(source) || 0) + 1
    seen.set(source, count)
    const repeated = directives.filter((candidate) => sourceOf(candidate) === source).length > 1
    return textField(repeated ? `${source} ${count}` : source, directive.value)
  })
}
const httpCanonicalRows = (urls: string[]) => urls.map((url, index) => webUrlField(urls.length > 1 ? `HTTP canonical ${index + 1}` : 'HTTP canonical', url))

export const canonicalNoindexConflictRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
    ],
    description: 'Warns when a canonical (HTML or HTTP header) coexists with noindex (meta robots or X-Robots-Tag) - conflicting signals.',
  },
  async run(page) {
    const linkEl = page.doc.querySelector(CANONICAL_SELECTOR)
    const htmlCanonical = (linkEl?.getAttribute('href') || '').trim()
    const headerVal = linkHeaderOf(page.headers)
    const headerCanonicals = parseHeaderCanonicals(headerVal)
    const hasCanonical = !!htmlCanonical || headerCanonicals.length > 0

    // Meta names are case-insensitive to Google, and crawler-scoped metas
    // (name="googlebot") carry the same rules as name="robots".
    const robotsMeta = page.doc.querySelector(ROBOTS_SELECTOR)
    const effective = pageEffectiveRobots(page)
    const noindexSources = effective.directives.filter((directive) => directive.hasNoindex).map(sourceOf)
    const hasNoindex = noindexSources.length > 0

    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const elements = [linkEl, robotsMeta].filter((element): element is Element => Boolean(element))
    const records = elementRecords(elements, elements.length, (element) => element === linkEl
      ? [hrefField(element, page.url)] : [textField('content', (element.getAttribute('content') || '').trim() || 'Not declared')])
    const values = [
      ...(htmlCanonical ? canonicalRows(htmlCanonical, resolveUrl(htmlCanonical, page.url)) : []),
      ...httpCanonicalRows(headerCanonicals),
      ...(hasCanonical ? [] : [textField('Canonical', 'Not found')]),
      textField('noindex', hasNoindex ? listRow([...new Set(noindexSources)]) : 'Not found'),
      ...overviewMarkup(records.markup),
    ]
    const input = headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM'
    return presentResult(canonicalNoindexConflictRule, page, {
      input,
      type: hasCanonical && hasNoindex ? 'warn' : 'info',
      priority: hasCanonical && hasNoindex ? 160 : 900,
      values,
      detailValues: [...(elements.length ? records.counts : []), ...instructionRows(effective.directives)],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original canonical and robots markup not retained', 'No canonical or robots meta element found; HTTP header evidence shown separately'),
    })
  },
}
