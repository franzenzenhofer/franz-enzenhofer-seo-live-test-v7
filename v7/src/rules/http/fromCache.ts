import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const isFromCache = (page: { fromCache?: boolean }, events: unknown): boolean | null => {
  if (typeof page.fromCache === 'boolean') return page.fromCache
  if (!Array.isArray(events)) return null
  const hit = events.find((e) => (e as { t?: string; c?: boolean }).t === 'req:mainDone' && (e as { c?: boolean }).c === true)
  return hit ? true : null
}

export const fromCacheRule: Rule = {
  id: 'http:from-cache', name: 'Served from Browser Cache', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'franz',
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    description: 'Warns when the analyzed document was delivered from the browser (private) cache - making captured HTTP-header checks unreliable - and recommends a hard reload; info otherwise.',
  },
  async run(page, ctx) {
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(fromCacheRule, page, 'None (response headers used only as a capture gate)')
    const events = (ctx.globals as { events?: unknown }).events
    const cached = isFromCache(page, events)
    const cacheSource = cached === true ? 'Browser cache' : cached === false ? 'Network' : 'Unknown'
    const checked = [textField('Signal', 'Page load fromCache flag / navigation events'),
      textField('Criterion', 'warn only when confirmed served from the browser cache, because captured HTTP headers may then not reflect the live response')]
    if (cached) return presentResult(fromCacheRule, page, {
      input: 'Navigation events', type: 'warn', priority: 150,
      values: [textField('Cache source', cacheSource)],
      checked, noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
    return presentResult(fromCacheRule, page, {
      input: 'Navigation events', type: 'info', priority: 850,
      values: [textField('Cache source', cacheSource)],
      checked, noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
  },
}
