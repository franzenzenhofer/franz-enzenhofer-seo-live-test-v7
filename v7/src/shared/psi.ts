import { PSIResponse } from './schemas.js'

export type PSIResult = {
  lighthouseResult?: {
    audits?: Record<string, { numericValue?: number }>
    categories?: { performance?: { score?: number } }
    fetchTime?: string
    finalDisplayedUrl?: string
    finalUrl?: string
    runWarnings?: string[]
    userAgent?: string
  }
}

// Default PSI API key - users can override in settings
// This is a free public API key for PageSpeed Insights
export const DEFAULT_PSI_KEY = 'AIzaSyA725ufYWi-tYPleOUdN3Qn6-c19w04DmE' as const

const keyOf = (u: string, s: string, k: string) => `psi:${k}:${s}:${u}`
const now = () => Date.now()

// Rules sharing a strategy (psi:mobile and psi:mobile-fcp-tbt) start together and would
// both miss the cache, paying twice for one identical ~20s Lighthouse run. Single-flight
// collapses concurrent callers onto one request.
const inFlight = new Map<string, Promise<PSIResult>>()

const read = async (k: string): Promise<{ ts: number; data: PSIResult } | null> => {
  try {
    const { [k]: val } = await chrome.storage.session.get(k)
    return val || null
  } catch {
    return null
  }
}

const write = async (k: string, v: { ts: number; data: PSIResult }) => {
  try {
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
  const j = parsed.data as PSIResult
  await write(k, { ts: now(), data: j })
  return j
}

export const runPSI = async (url: string, strategy: 'mobile'|'desktop', key: string): Promise<PSIResult> => {
  const k = keyOf(url, strategy, key)
  const cur = await read(k)
  if (cur && now() - cur.ts < 5 * 60_000) return cur.data
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
