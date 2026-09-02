import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'X-Cache Hit/Miss'
const RULE_ID = 'http:x-cache'

const getCaseInsensitiveHeader = (headers: Record<string, string> | undefined, key: string): string => {
  if (!headers) return ''
  return (headers[key] || headers[key.toLowerCase()] || '').trim()
}

export const xCacheRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'general',
    references: ['https://www.fastly.com/documentation/reference/http/http-headers/X-Cache'],
    description: "Reports the vendor X-Cache CDN debug header (info-only), classifying values containing 'hit'/'miss' as HIT/MISS.",
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const xCacheHeader = getCaseInsensitiveHeader(page.headers, 'x-cache')
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
          httpHeaders: page.headers || {},
          snippet: extractSnippet('(not present)'),
          xCacheHeader: '',
          hasXCache: false,
        },
      }
    }
    const isHit = xCacheLower.includes('hit')
    const isMiss = xCacheLower.includes('miss')
    const cacheStatus = isHit ? 'HIT' : isMiss ? 'MISS' : xCacheHeader
    const message = `X-Cache: ${cacheStatus}`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: 800,
      details: {
        httpHeaders: page.headers || {},
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

