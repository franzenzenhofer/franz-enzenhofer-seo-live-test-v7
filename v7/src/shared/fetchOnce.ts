import { incr } from './telemetry'

export type FetchOnceResult = { status: number; ok: boolean; text: string }

// Promise-cached (single-flight): concurrent callers of the same URL share one
// request. Successes stay cached for a short TTL; failures are evicted once
// settled so a transient network error is not frozen for the document lifetime.
type Entry = { ts: number; promise: Promise<FetchOnceResult | null> }
const cache = new Map<string, Entry>()
const DEFAULT_TIMEOUT_MS = 1500
const SUCCESS_TTL_MS = 5 * 60_000

const isValidHttpUrl = (url: string): boolean => {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<FetchOnceResult | null> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) incr('fetch.fail')
    const text = await res.text()
    return { status: res.status, ok: res.ok, text }
  } catch {
    incr('fetch.fail')
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const fetchStatusTextOnce = (url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<FetchOnceResult | null> => {
  if (!isValidHttpUrl(url)) {
    console.error(`[fetchTextOnce] Invalid URL blocked: ${url}`)
    return Promise.resolve(null)
  }
  const entry = cache.get(url)
  if (entry && Date.now() - entry.ts < SUCCESS_TTL_MS) return entry.promise
  const promise = fetchWithTimeout(url, timeoutMs)
  const fresh: Entry = { ts: Date.now(), promise }
  cache.set(url, fresh)
  promise
    .then((result) => {
      if (result === null && cache.get(url) === fresh) cache.delete(url)
      return result
    })
    .catch(() => { if (cache.get(url) === fresh) cache.delete(url) })
  return promise
}

export const fetchTextOnce = async (url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string | null> => {
  const result = await fetchStatusTextOnce(url, timeoutMs)
  return result && result.ok ? result.text : null
}
