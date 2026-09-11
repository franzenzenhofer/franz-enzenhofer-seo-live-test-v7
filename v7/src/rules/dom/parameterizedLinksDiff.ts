import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Parameterized links (static vs idle)'
const RULE_ID = 'dom:parameterized-links-diff'
const URL_EVIDENCE_LIMIT = 10

const normalize = (hrefs: string[], base: URL) => hrefs.flatMap((href) => {
  try {
    const url = new URL(href, base)
    if (url.host !== base.host) return []
    url.hash = ''
    return [url.href]
  } catch { return [] }
})

const factsInput = (page: { staticFacts?: unknown; idleFacts?: unknown }) => {
  const parts = [page.staticFacts && 'Static DOM', page.idleFacts && 'Idle DOM'].filter(Boolean)
  return parts.length ? parts.join(' + ') : 'Not captured'
}

const urlRecord = (name: string, value: string) => ({
  name, fields: [/^https?:\/\//i.test(value) ? urlField('URL', value) : textField('URL', value)],
})

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
        values: [textField('Page URL parse', 'Invalid')],
        checked: [...common.checked, textField('Page URL', page.url || 'Empty'), textField('Criterion', 'Page URL must parse as an absolute URL')],
        noMarkup: 'None - the page URL could not be parsed',
      })
    }
    if (!page.staticFacts || !page.idleFacts) {
      return presentResult(parameterizedLinksDiffRule, page, {
        ...common, input: factsInput(page), type: 'runtime_error', priority: 900,
        values: [textField('Static DOM facts', page.staticFacts ? 'Captured' : 'Not captured'),
          textField('Idle DOM facts', page.idleFacts ? 'Captured' : 'Not captured')],
        checked: [...common.checked, textField('Requirement', 'Both static and idle DOM facts must be captured for an exact comparison')],
        noMarkup: 'None - static and idle DOM facts are required for this comparison',
      })
    }
    if (page.staticFacts.parameterizedLinksTruncated || page.idleFacts.parameterizedLinksTruncated) {
      return presentResult(parameterizedLinksDiffRule, page, {
        ...common, input: factsInput(page), type: 'runtime_error', priority: 900,
        values: [textField('Static parameterized links recorded', page.staticFacts.parameterizedLinkCount),
          textField('Idle parameterized links recorded', page.idleFacts.parameterizedLinkCount)],
        checked: [...common.checked, textField('Requirement', 'Exact per-phase link evidence must not exceed the bounded contract')],
        detailValues: [textField('Comparison result', 'Unavailable - bounded evidence exceeded')],
        noMarkup: 'None - exact phase evidence exceeded the bounded contract',
      })
    }
    const staticUrls = normalize(page.staticFacts.parameterizedLinks, base)
    const idleUrls = normalize(page.idleFacts.parameterizedLinks, base)
    const staticOnly = staticUrls.filter((url) => !idleUrls.includes(url))
    const idleOnly = idleUrls.filter((url) => !staticUrls.includes(url))
    const hasDiff = staticOnly.length > 0 || idleOnly.length > 0

    return presentResult(parameterizedLinksDiffRule, page, {
      ...common, input: 'Static DOM + Idle DOM', type: hasDiff ? 'warn' : 'ok', priority: hasDiff ? 250 : 850,
      values: [textField('Only in static DOM', staticOnly.length), textField('Only in idle DOM', idleOnly.length)],
      detailValues: [textField('Static parameterized links checked', staticUrls.length), textField('Idle parameterized links checked', idleUrls.length),
        textField('Only in static URLs retained', Math.min(staticOnly.length, URL_EVIDENCE_LIMIT)), textField('Only in static URLs omitted', Math.max(0, staticOnly.length - URL_EVIDENCE_LIMIT)),
        textField('Only in idle URLs retained', Math.min(idleOnly.length, URL_EVIDENCE_LIMIT)), textField('Only in idle URLs omitted', Math.max(0, idleOnly.length - URL_EVIDENCE_LIMIT))],
      checked: [...common.checked, textField('Host match', 'Resolved URL host equals the page URL host'),
        textField('Criterion', 'Every same-host parameterized URL is present in both phases')],
      evidence: [
        ...staticOnly.slice(0, URL_EVIDENCE_LIMIT).map((url, index) => urlRecord(`Only in static ${index + 1}`, url)),
        ...idleOnly.slice(0, URL_EVIDENCE_LIMIT).map((url, index) => urlRecord(`Only in idle ${index + 1}`, url)),
      ],
      noMarkup: 'None - this rule compares recorded parameterized-link URLs across DOM phases, not element markup',
    })
  },
}
