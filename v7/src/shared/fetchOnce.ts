import { incr } from './telemetry'

const cache = new Map<string, Promise<string | null>>()
const DEFAULT_TIMEOUT_MS = 1500

const isValidHttpUrl = (url: string): boolean => {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) { incr('fetch.fail'); return null }
    return await res.text()
  } catch {
    incr('fetch.fail')
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const fetchTextOnce = (url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string | null> => {
  if (!isValidHttpUrl(url)) {
    console.error(`[fetchTextOnce] Invalid URL blocked: ${url}`)
    return Promise.resolve(null)
  }
  if (!cache.has(url)) {
    cache.set(url, fetchWithTimeout(url, timeoutMs))
  }
  return cache.get(url)!
}
