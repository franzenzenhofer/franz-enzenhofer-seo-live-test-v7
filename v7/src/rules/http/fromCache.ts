import type { Rule } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Served from Browser Cache'
const RULE_ID = 'http:from-cache'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching'

const isFromCache = (page: { fromCache?: boolean }, events: unknown): boolean | null => {
  if (typeof page.fromCache === 'boolean') return page.fromCache
  if (!Array.isArray(events)) return null
  const hit = events.find((e) => (e as { t?: string; c?: boolean }).t === 'req:mainDone' && (e as { c?: boolean }).c === true)
  return hit ? true : null
}

export const fromCacheRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page, ctx) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const events = (ctx.globals as { events?: unknown }).events
    const cached = isFromCache(page, events)
    if (cached) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Page delivered via browser cache. Some HTTP header checks may be unreliable. Try Shift+Reload.',
        type: 'warn',
        priority: 1000,
        details: { fromCache: true, httpHeaders: page.headers || {}, reference: SPEC },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: cached === false ? 'Served from network (not browser cache).' : 'Cache delivery status unknown.',
      type: 'info',
      priority: 850,
      details: { fromCache: cached, httpHeaders: page.headers || {}, reference: SPEC },
    }
  },
}
