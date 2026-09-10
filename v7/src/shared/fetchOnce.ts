import { incr } from './telemetry'
import { anonymousFetch } from './probeFetch'
import { abortScope, throwIfAborted } from './abort'
import { readBoundedText } from './responseBody'
import { createSingleFlight } from './singleFlight'
import { noteProbeResponse, withSiteProbe } from './siteProbeQueue'

// Google stops reading robots.txt at 500 KiB and ignores the rest, so the
// shared probe keeps exactly that much and says when more existed.
export const FETCH_ONCE_MAX_BYTES = 512_000
export type FetchOnceResult = {
  status: number; ok: boolean; text: string; bytes: number; truncated: boolean
  url?: string; headers?: Record<string, string>
}
const DEFAULT_TIMEOUT_MS = 1500
const shared = createSingleFlight<FetchOnceResult | null>(5 * 60_000, (result) => result !== null && result.status !== 429 && result.status !== 503)

const isValidHttpUrl = (url: string): boolean => {
  try { return ['http:', 'https:'].includes(new URL(url).protocol) } catch { return false }
}

const fetchWithTimeout = (url: string, timeoutMs: number, signal: AbortSignal) =>
  withSiteProbe(url, signal, async (): Promise<FetchOnceResult | null> => {
    const scope = abortScope(timeoutMs, signal)
    try {
      throwIfAborted(scope.signal)
      const res = await anonymousFetch(url, { signal: scope.signal })
      noteProbeResponse(url, res)
      if (!res.ok) incr('fetch.fail')
      const body = await readBoundedText(res, { signal: scope.signal, maxBytes: FETCH_ONCE_MAX_BYTES })
      const headers: Record<string, string> = {}
      res.headers?.forEach?.((value, key) => { headers[key.toLowerCase()] = value })
      return { status: res.status, ok: res.ok, text: body.text, bytes: body.bytes, truncated: body.truncated,
        ...(res.url ? { url: res.url } : {}), ...(Object.keys(headers).length ? { headers } : {}) }
    } catch {
      throwIfAborted(signal)
      incr('fetch.fail')
      return null
    } finally { scope.dispose() }
  })

export const fetchStatusTextOnce = (url: string, timeoutMs = DEFAULT_TIMEOUT_MS, signal?: AbortSignal): Promise<FetchOnceResult | null> => {
  // Loud on the console: a blocked scheme (chrome://, file://, ...) is a caller
  // bug, not a network condition, and silently returning null would hide it.
  if (!isValidHttpUrl(url)) {
    console.error(`[fetchTextOnce] Invalid URL blocked: ${url}`)
    return Promise.resolve(null)
  }
  return shared(url, (sharedSignal) => fetchWithTimeout(url, timeoutMs, sharedSignal), signal)
}

export const fetchTextOnce = async (url: string, timeoutMs = DEFAULT_TIMEOUT_MS, signal?: AbortSignal): Promise<string | null> => {
  const result = await fetchStatusTextOnce(url, timeoutMs, signal)
  return result && result.ok ? result.text : null
}
