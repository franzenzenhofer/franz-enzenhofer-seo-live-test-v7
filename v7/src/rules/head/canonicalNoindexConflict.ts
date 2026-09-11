import type { Rule } from '@/core/types'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

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
const safeUrlField = (key: string, value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return urlField(key, value)
  } catch { /* not an absolute, parseable URL */ }
  return textField(key, value)
}
const present = (value: boolean) => (value ? 'Observed' : 'Not observed in checked input')
const effectiveFields = (effective: ReturnType<typeof pageEffectiveRobots>) => [
  textField('Effective crawler', effective.userAgent),
  textField('Effective nofollow', present(effective.nofollow)),
  textField('Effective nosnippet', present(effective.nosnippet)),
  textField('Effective noimageindex', present(effective.noimageindex)),
  textField('Effective max-snippet', effective.maxSnippet === null ? 'Not declared' : effective.maxSnippet),
  textField('Effective max-video-preview', effective.maxVideoPreview === null ? 'Not declared' : effective.maxVideoPreview),
  textField('Effective max-image-preview', effective.maxImagePreview || 'Not declared'),
  textField('Applicable instruction count', effective.directives.length),
]
const directiveEvidence = (effective: ReturnType<typeof pageEffectiveRobots>) => effective.directives.map((directive, index) => ({
  name: `Applicable instruction ${index + 1}`,
  fields: [
    textField('Source', directive.source === 'meta' ? 'HTML meta tag' : 'HTTP response header'),
    textField('Crawler', directive.ua === 'robots' ? 'All crawlers (including Googlebot)' : directive.ua),
    textField('Instruction', directive.value),
    textField('Contains noindex', directive.hasNoindex ? 'Yes' : 'No'),
    ...(directive.headerKey ? [textField('Header name', directive.headerKey)] : []),
  ],
}))
const headerFact = (value: string, captured: boolean) => value || (captured ? 'Not present in checked input' : 'Not captured')

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
    const hasNoindexMeta = effective.directives.some((directive) => directive.source === 'meta' && directive.hasNoindex)
    const xRobotsRaw = page.headers?.['x-robots-tag'] || ''
    const hasNoindexHeader = effective.directives.some((directive) => directive.source === 'header' && directive.hasNoindex)
    const hasNoindex = hasNoindexMeta || hasNoindexHeader

    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const canonicalMarkup = markupEvidence(linkEl ? [linkEl] : [], 'Canonical link')
    const robotsMarkup = markupEvidence(robotsMeta ? [robotsMeta] : [], 'Robots meta')
    const markup = [...canonicalMarkup.markup, ...robotsMarkup.markup]
    const evidence = [
      { name: 'Canonical sources', fields: [
        ...(canonicalMarkup.fields.length ? canonicalMarkup.fields : [textField('HTML canonical', 'Not found')]),
        textField('HTTP Link header', headerFact(headerVal, page.headers !== undefined)),
      ] },
      { name: 'Robots sources', fields: [
        ...(robotsMarkup.fields.length ? robotsMarkup.fields : [textField('Robots meta', 'Not found')]),
        textField('X-Robots-Tag header', headerFact(xRobotsRaw, page.headers !== undefined)),
      ] },
      ...directiveEvidence(effective),
    ]
    const values = [
      textField('Canonical sources', (htmlCanonical ? 1 : 0) + headerCanonicals.length),
      textField('HTML canonical', htmlCanonical || 'Not present in checked input'),
      ...headerCanonicals.map((value, index) => safeUrlField(`HTTP canonical ${index + 1}`, value)),
      textField('Noindex', present(hasNoindex)),
      textField('Noindex meta', present(hasNoindexMeta)),
      textField('Noindex header', present(hasNoindexHeader)),
      textField('Conflict', hasCanonical && hasNoindex ? 'Detected' : 'Not detected'),
    ]
    const input = headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM'
    return presentResult(canonicalNoindexConflictRule, page, {
      input,
      type: hasCanonical && hasNoindex ? 'warn' : 'info',
      priority: hasCanonical && hasNoindex ? 160 : 900,
      values, detailValues: effectiveFields(effective), checked, evidence, markup,
      noMarkup: linkEl || robotsMeta ? 'Complete original canonical and robots markup not retained' : 'No canonical or robots meta element found; HTTP header evidence shown separately',
    })
  },
}
