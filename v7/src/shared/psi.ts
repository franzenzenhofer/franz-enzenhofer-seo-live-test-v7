import { slimPSI, type PSIResult } from './psiSlim.js'
import { PSIResponse } from './schemas.js'

export type { PSIResult } from './psiSlim.js'

// Default PSI API key - users can override in settings
// This is a free public API key for PageSpeed Insights
export const DEFAULT_PSI_KEY = 'AIzaSyA725ufYWi-tYPleOUdN3Qn6-c19w04DmE' as const

const KEY_PREFIX = 'psi:'
const TTL_MS = 5 * 60_000
type CacheEntry = { ts: number; data: PSIResult }

const keyOf = (u: string, s: string, k: string) => `${KEY_PREFIX}${k}:${s}:${u}`
const now = () => Date.now()

// Rules sharing a strategy (psi:mobile and psi:mobile-fcp-tbt) start together and would
// both miss the cache, paying twice for one identical ~20s Lighthouse run. Single-flight
// collapses concurrent callers onto one request.
const inFlight = new Map<string, Promise<PSIResult>>()

const read = async (k: string): Promise<CacheEntry | null> => {
  try {
    const { [k]: val } = await chrome.storage.session.get(k)
    return val || null
  } catch {
    return null
  }
}

const isExpired = (v: unknown, t: number): boolean =>
  typeof v === 'object' && v !== null && typeof (v as CacheEntry).ts === 'number' && t - (v as CacheEntry).ts >= TTL_MS

// chrome.storage.session holds 10 MB and nothing else ever removes psi: keys, so every write
// first drops the entries the TTL in runPSI would refuse to serve anyway.
const evictExpired = async (t: number) => {
  const all = await chrome.storage.session.get(null)
  const stale = Object.entries(all)
    .filter(([key, v]) => key.startsWith(KEY_PREFIX) && isExpired(v, t))
    .map(([key]) => key)
  if (stale.length) await chrome.storage.session.remove(stale)
}

const write = async (k: string, v: CacheEntry) => {
  try {
    await evictExpired(v.ts)
    await chrome.storage.session.set({ [k]: v })
  } catch { /* ignore quota errors */ }
  return true
}

const fetchPSI = async (url: string, strategy: 'mobile'|'desktop', key: string, k: string): Promise<PSIResult> => {
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=${strategy}&url=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}`
  const r = await fetch(api)
  if (!r.ok) throw new Error(`PSI ${r.status}`)
  const parsed = PSIResponse.safeParse(await r.json())
  if (!parsed.success) throw new Error(`PSI response malformed: ${parsed.error.issues[0]?.message || 'schema mismatch'}`)
  const j = slimPSI(parsed.data)
  await write(k, { ts: now(), data: j })
  return j
}

export const runPSI = async (url: string, strategy: 'mobile'|'desktop', key: string): Promise<PSIResult> => {
  const k = keyOf(url, strategy, key)
  const cur = await read(k)
  if (cur && now() - cur.ts < TTL_MS) return cur.data
  const pending = inFlight.get(k)
  if (pending) return pending
  const task = fetchPSI(url, strategy, key, k).finally(() => { inFlight.delete(k) })
  inFlight.set(k, task)
  return task
}

export const getPSIKey = (userKey: string | null | undefined): string => {
  const trimmed = (userKey || '').trim()
  return trimmed || DEFAULT_PSI_KEY
}

export const isUsingDefaultPSIKey = (userKey: string | undefined): boolean => {
  return !userKey || userKey.trim() === ''
}
