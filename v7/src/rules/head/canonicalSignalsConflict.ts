import { canonicalRows, hrefField, isWebUrl, markupReason, resolveUrl, webUrlField } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'
import { differingComponent } from '@/shared/presentation/comparison'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
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
const webUrl = (value: string, base: string) => { const resolved = value ? resolveUrl(value, base) : null; return resolved && isWebUrl(resolved) ? resolved : null }
// The HTTP side of the comparison: the header canonical, or the fact that none was captured or found.
const httpRows = (headerHref: string, resolved: string | null, captured: boolean): DisplayField[] => {
  if (!captured) return []
  if (!headerHref) return [textField('HTTP canonical', 'Not found')]
  return [...(headerHref === resolved ? [] : [textField('HTTP href', headerHref)]), resolved ? webUrlField('HTTP canonical', resolved) : textField('HTTP canonical', 'Invalid URL')]
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
    const htmlCanonical = webUrl(htmlHref, page.url)
    const headerCanonical = webUrl(headerHref, page.url)
    const invalid = Boolean((htmlHref && !htmlCanonical) || (headerHref && !headerCanonical))
    const both = Boolean(htmlCanonical && headerCanonical)
    const matches = both && normalizeUrl(htmlCanonical!) === normalizeUrl(headerCanonical!)
    const headersCaptured = page.headers !== undefined

    const records = elementRecords(element ? [element] : [], element ? 1 : 0, (link) => [hrefField(link, page.url)])
    const comparison = !both || invalid ? []
      : [textField('Comparison', matches ? 'Equals HTTP canonical' : `Differs from HTTP canonical (${differingComponent(htmlCanonical!, headerCanonical!) ?? 'normalized'})`)]
    const values = [
      ...(htmlHref ? canonicalRows(htmlHref, htmlCanonical) : [textField('Canonical link', 'Not found')]),
      ...httpRows(headerHref, headerCanonical, headersCaptured), ...comparison, ...records.markup,
    ]

    // "Page URL" is only an actual input when at least one declared href was
    // resolved against it; the no-sources branch never reads page.url.
    const input = [
      'Static DOM',
      ...(headersCaptured ? ['HTTP response headers'] : []),
      ...(htmlHref || headerHref ? ['Page URL'] : []),
    ].join(' + ')
    return presentResult(canonicalSignalsConflictRule, page, {
      input, type: invalid || matches ? 'warn' : both ? 'error' : 'info', priority: both && !matches ? 80 : 700,
      values, detailValues: element ? records.counts : [], checked, evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original HTML canonical markup not retained', 'No HTML canonical element; HTTP header evidence is reported separately'),
    })
  },
}
