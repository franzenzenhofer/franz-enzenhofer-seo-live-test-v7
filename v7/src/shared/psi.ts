import { slimPSI, type PSIResult } from './psiSlim.js'
import { PSIResponse } from './schemas.js'
import { assertSafeProbe } from './probeSafety.js'

export type { PSIResult } from './psiSlim.js'

// Default PSI API key - users can override in settings
// This is a free public API key for PageSpeed Insights
export const DEFAULT_PSI_KEY = 'AIzaSyA725ufYWi-tYPleOUdN3Qn6-c19w04DmE' as const

// There is deliberately no persistent cache here. PSI rules run in the offscreen document, and
// offscreen documents get chrome.runtime only - chrome.storage is undefined there
// (https://developer.chrome.com/docs/extensions/reference/api/offscreen). The CLI runner has no
// chrome at all. A chrome.storage.session cache never held a single entry in either context.
//
// What does work is single-flight: rules sharing a strategy (psi:mobile and psi:mobile-fcp-tbt)
// start together and would pay twice for one identical ~20s Lighthouse run. Concurrent callers
// with the same url + strategy + api key share one request. The entry is dropped as soon as the
// request settles, so sequential calls fetch again and a failure never blocks a retry.
const inFlight = new Map<string, Promise<PSIResult>>()

const inFlightKey = (url: string, strategy: string, key: string) => `${key}:${strategy}:${url}`

const fetchPSI = async (url: string, strategy: 'mobile'|'desktop', key: string): Promise<PSIResult> => {
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=${strategy}&url=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}`
  const r = await fetch(api)
  if (!r.ok) throw new Error(`PSI ${r.status}`)
  const parsed = PSIResponse.safeParse(await r.json())
  if (!parsed.success) throw new Error(`PSI response malformed: ${parsed.error.issues[0]?.message || 'schema mismatch'}`)
  return slimPSI(parsed.data)
}

export const runPSI = async (url: string, strategy: 'mobile'|'desktop', key: string): Promise<PSIResult> => {
  // PSI makes Google request the URL: never hand it a back-office, action or token URL.
  assertSafeProbe(url)
  const k = inFlightKey(url, strategy, key)
  const pending = inFlight.get(k)
  if (pending) return pending
  const task = fetchPSI(url, strategy, key).finally(() => { inFlight.delete(k) })
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
