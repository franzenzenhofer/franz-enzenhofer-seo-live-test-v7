import { PHASE_FACTS_MISSING_INPUT, phaseFactsMissingRow } from './phaseFactsMissing'

import type { Rule } from '@/core/types'
import { recordCounts } from '@/shared/presentation/counts'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'

const NAME = 'Parameterized links (static vs idle)'
const RULE_ID = 'dom:parameterized-links-diff'
const URL_EVIDENCE_LIMIT = 10
const OVERVIEW_URL_LIMIT = 3

const normalize = (hrefs: string[], base: URL) => hrefs.flatMap((href) => {
  try {
    const url = new URL(href, base)
    if (url.host !== base.host) return []
    url.hash = ''
    return [url.href]
  } catch { return [] }
})

// Differing URLs keyed by the phase that has them, numbered only when a phase has several.
const urlRows = (name: string, urls: string[]): DisplayField[] => urls.map((url, index) => urlField(urls.length > 1 ? `${name} ${index + 1}` : name, url))

export const parameterizedLinksDiffRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
    ],
    description: 'Compares same-host parameterized links between static and idle DOM and warns when JavaScript adds or removes them.',
  },
  async run(page) {
    const common = { checked: [textField('Comparison', 'Same-host URLs from recorded parameterized links, hash removed')] }
    let base: URL
    try {
      base = new URL(page.url)
    } catch {
      return presentResult(parameterizedLinksDiffRule, page, {
        ...common, input: 'Page URL', type: 'runtime_error', priority: 10,
        values: [textField('Current page URL', 'Invalid')],
        checked: [...common.checked, textField('Received value', page.url || 'Empty'), textField('Criterion', 'Page URL must parse as an absolute URL')],
        noMarkup: 'None - the page URL could not be parsed',
      })
    }
    if (!page.staticFacts || !page.idleFacts) {
      return presentResult(parameterizedLinksDiffRule, page, {
        ...common, input: PHASE_FACTS_MISSING_INPUT, type: 'runtime_error', priority: 900,
        values: [phaseFactsMissingRow(page.staticFacts, page.idleFacts)],
        checked: [...common.checked, textField('Requirement', 'Both static and idle DOM facts must be captured for an exact comparison')],
        noMarkup: 'None - static and idle DOM facts are required for this comparison',
      })
    }
    // The first row states both sides of the comparison as one fact, never as a bare count (FORMATTING.md F1, F12).
    const sidesRow = (key: string, staticCount: number, idleCount: number) => textField(key, `${staticCount} static, ${idleCount} idle`)
    if (page.staticFacts.parameterizedLinksTruncated || page.idleFacts.parameterizedLinksTruncated) {
      return presentResult(parameterizedLinksDiffRule, page, {
        ...common, input: 'Static DOM + Idle DOM', type: 'runtime_error', priority: 900,
        values: [sidesRow('Links recorded', page.staticFacts.parameterizedLinkCount, page.idleFacts.parameterizedLinkCount), textField('Link evidence', 'Truncated')],
        checked: [...common.checked, textField('Requirement', 'Exact per-phase link evidence must not exceed the bounded contract')],
        noMarkup: 'None - exact phase evidence exceeded the bounded contract',
      })
    }
    const staticUrls = normalize(page.staticFacts.parameterizedLinks, base)
    const idleUrls = normalize(page.idleFacts.parameterizedLinks, base)
    const staticOnly = staticUrls.filter((url) => !idleUrls.includes(url))
    const idleOnly = idleUrls.filter((url) => !staticUrls.includes(url))
    const hasDiff = staticOnly.length > 0 || idleOnly.length > 0
    const evidence = [
      ...staticOnly.slice(0, URL_EVIDENCE_LIMIT).map((url, index) => ({ name: `Only in static ${index + 1}`, fields: [urlField('URL', url)] })),
      ...idleOnly.slice(0, URL_EVIDENCE_LIMIT).map((url, index) => ({ name: `Only in idle ${index + 1}`, fields: [urlField('URL', url)] })),
    ]
    const overviewUrls = staticOnly.length + idleOnly.length <= OVERVIEW_URL_LIMIT
      ? [...urlRows('Only in static', staticOnly), ...urlRows('Only in idle', idleOnly)]
      : [...urlRows('Only in static', staticOnly.slice(0, 1)), ...urlRows('Only in idle', idleOnly.slice(0, 1))]

    return presentResult(parameterizedLinksDiffRule, page, {
      ...common, input: 'Static DOM + Idle DOM', type: hasDiff ? 'warn' : 'ok', priority: hasDiff ? 250 : 850,
      values: [sidesRow('Links compared', staticUrls.length, idleUrls.length),
        textField('Only in static DOM', staticOnly.length), textField('Only in idle DOM', idleOnly.length), ...overviewUrls],
      detailValues: hasDiff ? recordCounts({ found: staticOnly.length + idleOnly.length, markup: 0, evidence: evidence.length }) : [],
      checked: [...common.checked, textField('Host match', 'Resolved URL host equals the page URL host'),
        textField('Criterion', 'Every same-host parameterized URL is present in both phases')],
      evidence,
      noMarkup: 'Not retained: links are compared as recorded URLs, not as element markup',
    })
  },
}
