import { boundedEvidence } from '@/rules/http/resourceDelivery.evidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import type { ResourceFact } from '@/shared/resourceFacts'

const TEXTUAL = /^(text\/|application\/(javascript|x-javascript|json|ld\+json|xml|xhtml)|image\/svg)/i
const COMPRESSED = /\b(br|gzip|deflate|zstd)\b/i

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
    if (!facts?.length) return presentResult(resourceDeliveryRule, page, {
      input: coverage?.events ? 'Navigation events' : 'Not captured', type: 'info', priority: 900,
      values: [textField('Observed subresources', 0),
        textField('Resource evidence', coverage?.events ? 'Requests observed but no evidence retained' : 'No subresource requests captured')],
      detailValues: [textField('Resource requests observed', coverage?.events ?? 0)],
      checked, noMarkup,
    })
    const failed = facts.filter(isFailed)
    const textual = facts.filter(isTextual)
    const uncompressed = textual.filter((fact) => !COMPRESSED.test(header(fact, 'content-encoding')))
    const uncacheable = facts.filter((fact) => !header(fact, 'cache-control') && !header(fact, 'etag') && !header(fact, 'last-modified'))
    const failedEvidence = boundedEvidence('Failed resource', failed)
    const uncompressedEvidence = boundedEvidence('Uncompressed resource', uncompressed)
    const uncacheableEvidence = boundedEvidence('Uncacheable resource', uncacheable)
    return presentResult(resourceDeliveryRule, page, {
      input: 'Navigation events', type: failed.length ? 'error' : 'info', priority: failed.length ? 200 : 820,
      values: [textField('Observed subresources', facts.length), textField('Failed subresources', failed.length),
        textField('Uncompressed textual resources', uncompressed.length), textField('Resources without cache validator', uncacheable.length)],
      detailValues: [
        ...(coverage?.truncated ? [textField('Retained URLs', coverage.retained), textField('Dropped observations', coverage.dropped)] : []),
        textField('Failed evidence retained', failedEvidence.retained), textField('Failed evidence omitted', failedEvidence.omitted),
        textField('Uncompressed evidence retained', uncompressedEvidence.retained), textField('Uncompressed evidence omitted', uncompressedEvidence.omitted),
        textField('Uncacheable evidence retained', uncacheableEvidence.retained), textField('Uncacheable evidence omitted', uncacheableEvidence.omitted),
      ],
      checked,
      evidence: [...failedEvidence.records, ...uncompressedEvidence.records, ...uncacheableEvidence.records],
      noMarkup,
    })
  },
}
