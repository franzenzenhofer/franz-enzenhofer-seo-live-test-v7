import type { Rule } from '@/core/types'
import type { ResourceFact } from '@/shared/resourceFacts'

const LABEL = 'HTTP'
const NAME = 'Observed resource delivery'
const RULE_ID = 'http:resource-delivery'
const SHOWN = 20
const TEXTUAL = /^(text\/|application\/(javascript|x-javascript|json|ld\+json|xml|xhtml)|image\/svg)/i
const COMPRESSED = /\b(br|gzip|deflate|zstd)\b/i

const isFailed = (fact: ResourceFact) => !!fact.error || (typeof fact.status === 'number' && fact.status >= 400)
const header = (fact: ResourceFact, name: string) => fact.headers?.[name] || ''
const isTextual = (fact: ResourceFact) => TEXTUAL.test(header(fact, 'content-type'))
const describe = (fact: ResourceFact) => ({
  url: fact.url, type: fact.type, status: fact.status, error: fact.error,
  contentType: header(fact, 'content-type') || undefined,
})

export const resourceDeliveryRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
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
      return { label: LABEL, name: NAME, type: 'info', priority: 900,
        message: coverage?.events
          ? 'Resource requests were observed but no resource evidence was retained.'
          : 'No subresource requests were captured for this run.',
        details: { coverage: coverage || null } }
    }
    const failed = facts.filter(isFailed)
    const textual = facts.filter(isTextual)
    const uncompressed = textual.filter((fact) => !COMPRESSED.test(header(fact, 'content-encoding')))
    const uncacheable = facts.filter((fact) => !header(fact, 'cache-control') && !header(fact, 'etag') && !header(fact, 'last-modified'))
    const scope = coverage?.truncated
      ? ` Evidence covers ${coverage.retained} retained URLs; ${coverage.dropped} completed or failed observations were not retained, so these counts are a lower bound.`
      : ''
    const message = failed.length
      ? `${failed.length} of ${facts.length} observed subresources failed (4xx/5xx or network error).${scope}`
      : `All ${facts.length} observed subresources loaded; ${uncompressed.length} textual resources arrived uncompressed, ${uncacheable.length} carry no cache validator.${scope}`
    return {
      label: LABEL, name: NAME,
      type: failed.length ? 'error' : 'info',
      priority: failed.length ? 200 : 820,
      message,
      details: {
        observedResources: facts.length,
        failedCount: failed.length,
        failed: failed.slice(0, SHOWN).map(describe),
        textualCount: textual.length,
        uncompressedCount: uncompressed.length,
        uncompressed: uncompressed.slice(0, SHOWN).map(describe),
        uncacheableCount: uncacheable.length,
        uncacheable: uncacheable.slice(0, SHOWN).map(describe),
        shownPerList: SHOWN,
        coverage: coverage || null,
        tested: 'Passive: only headers already observed on this page load. No resource was refetched, and requests beyond the retained ledger are not represented.',
      },
    }
  },
}
