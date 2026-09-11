import type { Rule } from '@/core/types'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { normalizeUrl } from '@/shared/url-utils'

const NAME = 'HTML and HTTP canonical agreement'
const RULE_ID = 'head:canonical-signals-conflict'
const SELECTOR = 'link[rel~="canonical" i]'
const checked = [
  textField('HTML selector', SELECTOR), textField('HTTP header', 'Link; rel="canonical"'),
  textField('Selection', 'First HTML canonical and first HTTP canonical'),
  textField('Resolution', 'Each declared URL resolved against the page URL'),
  textField('Criterion', 'Both canonical declarations resolve to the same normalized URL'),
]
const webUrlField = (key: string, value: string) => (/^https?:\/\//i.test(value) ? urlField(key, value) : textField(key, value))
const resolve = (value: string, base: string): string => {
  try { return value ? new URL(value, base).href : '' } catch { return '' }
}

export const canonicalSignalsConflictRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls', 'https://www.rfc-editor.org/rfc/rfc6596'],
    description: 'Compares the first HTML and HTTP canonical declarations, identifies each source and distinguishes absence from agreement or conflict.',
    userGuide: {
      check: 'A canonical declaration suggests which URL should represent duplicate content in search. This compares the first HTML tag and HTTP Link header; Google’s actual canonical choice is not checked.',
      action: 'Choose the intended preferred URL and make both declarations consistent. Edit the HTML template or SEO plugin for the tag, and the server or CDN configuration for the HTTP Link header. Using one method reduces maintenance risk.',
    },
  },
  async run(page) {
    const element = page.doc.querySelector(SELECTOR)
    const htmlHref = (element?.getAttribute('href') || '').trim()
    const header = linkHeaderOf(page.headers)
    const headerHref = parseHeaderCanonicals(header)[0] || ''
    const htmlCanonical = resolve(htmlHref, page.url)
    const headerCanonical = resolve(headerHref, page.url)
    const sources = [
      { foundIn: 'HTML canonical tag', declaredUrl: htmlHref, resolvedUrl: htmlCanonical },
      { foundIn: 'HTTP Link header', declaredUrl: headerHref, resolvedUrl: headerCanonical },
    ].filter(({ declaredUrl }) => declaredUrl)
    const invalid = sources.some(({ resolvedUrl }) => !resolvedUrl || !/^https?:\/\//i.test(resolvedUrl))
    const both = Boolean(htmlCanonical && headerCanonical)
    const matches = both && normalizeUrl(htmlCanonical) === normalizeUrl(headerCanonical)
    const comparison = invalid ? 'Invalid or unsupported URL'
      : !sources.length ? 'No canonical declarations found'
        : !both ? `Only ${htmlCanonical ? 'HTML' : 'HTTP'} declares a canonical URL`
          : matches ? 'Canonicals agree' : 'Canonicals conflict'

    const captured = markupEvidence(element ? [element] : [], 'HTML canonical')
    const evidence = [
      { name: 'Capture', fields: [
        textField('HTML href (observed)', htmlHref || 'Not declared'),
        textField('HTTP Link header (raw)', header || (page.headers === undefined ? 'Not captured' : 'Not present')),
        ...captured.fields,
      ] },
      ...sources.map(({ foundIn, declaredUrl, resolvedUrl }) => ({ name: foundIn, fields: [
        textField('Declared URL', declaredUrl), webUrlField('Resolved URL', resolvedUrl || 'Invalid or unresolved'),
      ] })),
    ]
    const values = [
      htmlCanonical ? webUrlField('HTML canonical', htmlCanonical) : textField('HTML canonical', htmlHref ? 'Invalid or unresolved' : 'Not found'),
      headerCanonical ? webUrlField('HTTP canonical', headerCanonical) : textField('HTTP canonical', headerHref ? 'Invalid or unresolved' : 'Not found'),
      textField('Canonical sources', sources.length), textField('Comparison', comparison),
    ]

    // "Page URL" is only an actual input when at least one declared href was
    // resolved against it; the no-sources branch never reads page.url.
    const input = [
      'Static DOM',
      ...(page.headers === undefined ? [] : ['HTTP response headers']),
      ...(htmlHref || headerHref ? ['Page URL'] : []),
    ].join(' + ')
    return presentResult(canonicalSignalsConflictRule, page, {
      input, type: invalid || matches ? 'warn' : both ? 'error' : 'info', priority: both && !matches ? 80 : 700,
      values, checked, evidence, markup: captured.markup,
      noMarkup: element ? 'Complete original HTML canonical markup not retained' : 'No HTML canonical element; HTTP header evidence is reported separately',
    })
  },
}
