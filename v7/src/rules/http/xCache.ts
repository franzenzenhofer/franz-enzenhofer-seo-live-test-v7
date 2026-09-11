import { headerValue } from '@/shared/headerValue'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'X-Cache Hit/Miss'
const RULE_ID = 'http:x-cache'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

export const xCacheRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "X-Cache is a vendor-specific diagnostic header. HIT usually means a cache supplied a stored response; MISS usually means that layer needed to fetch it. Several values can describe several cache layers.",
      action: "Use the exact header value and your CDN documentation to investigate unexpected misses or stale responses. A miss can be normal, and this optional header does not need to be added just to pass an SEO test.",
    },
    provenance: 'general',
    references: ['https://www.fastly.com/documentation/reference/http/http-headers/X-Cache'],
    description: "Reports the vendor X-Cache CDN debug header (info-only), classifying values containing 'hit'/'miss' as HIT/MISS.",
  },
  async run(page) {
    if (!hasHeaders(page.headers)) {
      return presentResult(xCacheRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Header name', 'X-Cache'), textField('Capture requirement', 'Response headers must be captured')],
        noMarkup: NO_MARKUP,
      })
    }
    const xCacheHeader = headerValue(page.headers, 'x-cache')
    const xCacheLower = xCacheHeader.toLowerCase()
    const hasXCache = Boolean(xCacheHeader)
    const checked = [textField('Header name', 'X-Cache'), textField('Classification', 'Case-insensitive value search for hit and miss'), textField('Header source', 'Captured response headers')]
    if (!hasXCache) {
      return presentResult(xCacheRule, page, {
        input: 'HTTP response headers', type: 'info', priority: 900,
        values: [textField('X-Cache', 'Not present')],
        checked,
        evidence: [{ name: 'Retrieved response header', fields: [textField('Header value', 'Not present')] }],
        noMarkup: NO_MARKUP,
      })
    }
    const isHit = xCacheLower.includes('hit')
    const isMiss = xCacheLower.includes('miss')
    const cacheStatus = isHit && isMiss ? 'Mixed HIT and MISS across reported cache layers' : isHit ? 'HIT' : isMiss ? 'MISS' : xCacheHeader
    return presentResult(xCacheRule, page, {
      input: 'HTTP response headers', type: 'info', priority: 800,
      values: [textField('X-Cache', xCacheHeader), textField('Cache status', cacheStatus)],
      checked,
      evidence: [{ name: 'Retrieved response header', fields: [textField('Header value', xCacheHeader)] }],
      noMarkup: NO_MARKUP,
    })
  },
}
