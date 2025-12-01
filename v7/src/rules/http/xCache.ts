import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'X-Cache Hit/Miss'
const RULE_ID = 'http:x-cache'
const SPEC = 'https://developer.fastly.com/reference/http/http-headers/X-Cache'

const getCaseInsensitiveHeader = (headers: Record<string, string> | undefined, key: string): string => {
  if (!headers) return ''
  return (headers[key] || headers[key.toLowerCase()] || '').trim()
}

export const xCacheRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
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
          reference: SPEC,
        },
      }
    }
    const isHit = xCacheLower.includes('hit')
    const isMiss = xCacheLower.includes('miss')
    const status = isHit ? 'HIT' : isMiss ? 'MISS' : xCacheHeader
    const message = `X-Cache: ${status}`
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
        status,
        reference: SPEC,
      },
    }
  },
}

