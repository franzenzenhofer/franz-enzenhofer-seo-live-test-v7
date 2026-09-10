import { headerValue } from '@/shared/headerValue'
import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'X-Cache Hit/Miss'
const RULE_ID = 'http:x-cache'

export const xCacheRule: Rule = {
  id: RULE_ID,
  name: NAME,
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
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const xCacheHeader = headerValue(page.headers, 'x-cache')
    const xCacheLower = xCacheHeader.toLowerCase()
    const hasXCache = Boolean(xCacheHeader)
    if (!hasXCache) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No X-Cache header found.',
        type: 'info',
        priority: 900,
        details: {
          snippet: extractSnippet('(not present)'),
          xCacheHeader: '',
          hasXCache: false,
        },
      }
    }
    const isHit = xCacheLower.includes('hit')
    const isMiss = xCacheLower.includes('miss')
    const cacheStatus = isHit && isMiss ? 'Mixed HIT and MISS across reported cache layers' : isHit ? 'HIT' : isMiss ? 'MISS' : xCacheHeader
    const message = `X-Cache: ${cacheStatus}`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: 800,
      details: {
        snippet: extractSnippet(xCacheHeader),
        xCacheHeader,
        hasXCache: true,
        isHit,
        isMiss,
        cacheStatus,
      },
    }
  },
}

