
import { boundedEvidence } from '@/rules/http/resourceDelivery.evidence'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import type { ResourceFact } from '@/shared/resourceFacts'
import { listRow } from '@/shared/presentation/listRow'

const TEXTUAL = /^(text\/|application\/(javascript|x-javascript|json|ld\+json|xml|xhtml)|image\/svg)/i
const COMPRESSED = /\b(br|gzip|deflate|zstd)\b/i
const OVERVIEW_URL_LIMIT = 3

const isFailed = (fact: ResourceFact) => !!fact.error || (typeof fact.status === 'number' && fact.status >= 400)
const header = (fact: ResourceFact, name: string) => fact.headers?.[name] || ''
const isTextual = (fact: ResourceFact) => TEXTUAL.test(header(fact, 'content-type'))

const checked = [
  textField('Scope', 'Passive: only headers already observed on this page load; nothing refetched'),
  textField('Textual definition', 'Content-Type starts with text/, is javascript/json/xml, +json, +xml, or image/svg'),
  textField('Compression tokens', 'br, gzip, deflate, zstd'),
  textField('Criterion', 'error when any observed subresource failed (4xx/5xx or network error)'),
]
const noMarkup = 'None - this rule checks observed resource responses, not document markup'

// Up to three distinct failed URLs sit in the overview, so the finding is visible without opening details.
const failedUrlRows = (failed: ResourceFact[]) => {
  const urls = [...new Set(failed.map((fact) => fact.url))]
  return urls.length <= OVERVIEW_URL_LIMIT ? urls.map((url, index) => urlField(`Failed URL ${index + 1}`, url)) : []
}

export const resourceDeliveryRule: Rule = {
  id: 'http:resource-delivery', name: 'Observed resource delivery', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching',
    ],
    description: 'Reports failed, uncompressed and uncacheable subresources from the requests this page actually made. Passive only: nothing is refetched, and it speaks for the retained ledger, never for requests it did not keep.',
  },
  async run(page) {
    const facts = page.resourceFacts
    const coverage = page.resourceCoverage
    if (!facts?.length) {
      // Requests were observed but none retained, or the navigation events carried no resource ledger
      // at all, so the subresources could not be checked.
      const observed = coverage?.events ?? 0
      return presentResult(resourceDeliveryRule, page, {
        input: 'Navigation events', type: 'info', priority: 900,
        values: observed ? [textField('Requests observed', observed), textField('Retained responses', 'None')] : [textField('Subresource requests', 'Not checked')],
        checked, noMarkup,
      })
    }
    const failed = facts.filter(isFailed)
    const textual = facts.filter(isTextual)
    const uncompressed = textual.filter((fact) => !COMPRESSED.test(header(fact, 'content-encoding')))
    const uncacheable = facts.filter((fact) => !header(fact, 'cache-control') && !header(fact, 'etag') && !header(fact, 'last-modified'))
    const failedEvidence = boundedEvidence('Failed resource', failed)
    const uncompressedEvidence = boundedEvidence('Uncompressed resource', uncompressed)
    const uncacheableEvidence = boundedEvidence('Uncacheable resource', uncacheable)
    const types = [...new Set(facts.map((fact) => fact.type).filter((type): type is string => !!type))]
    return presentResult(resourceDeliveryRule, page, {
      input: 'Navigation events', type: failed.length ? 'error' : 'info', priority: failed.length ? 200 : 820,
      values: [textField('Types', listRow(types)), textField('Subresources', facts.length),
        textField('Failed', failed.length), ...failedUrlRows(failed),
        textField('Uncompressed textual', uncompressed.length), textField('No cache validator', uncacheable.length)],
      detailValues: [
        ...(coverage?.truncated ? [textField('Retained URLs', coverage.retained), textField('Dropped observations', coverage.dropped)] : []),
        ...failedEvidence.shown, ...uncompressedEvidence.shown, ...uncacheableEvidence.shown,
      ],
      checked,
      evidence: [...failedEvidence.records, ...uncompressedEvidence.records, ...uncacheableEvidence.records],
      noMarkup,
    })
  },
}
