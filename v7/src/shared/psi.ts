type PSIResult = { lighthouseResult?: { audits?: Record<string, { numericValue?: number }>; categories?: { performance?: { score?: number } } } }

// Default PSI API key (user can override in settings)
export const DEFAULT_PSI_KEY = '***REMOVED***' as const

const mem = new Map<string, { ts: number; data: PSIResult }>()
const keyOf = (u: string, s: string) => `psi:${s}:${u}`
const now = () => Date.now()

const read = async (k: string) => mem.get(k) || null
const write = async (k: string, v: { ts: number; data: PSIResult }) => { mem.set(k, v); return true }

export const runPSI = async (url: string, strategy: 'mobile'|'desktop', key: string): Promise<PSIResult> => {
  const k = keyOf(url, strategy)
  const cur = await read(k)
  if (cur && now() - cur.ts < 5 * 60_000) return cur.data
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=${strategy}&url=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}`
  const r = await fetch(api)
  if (!r.ok) throw new Error(`PSI ${r.status}`)
  const j = (await r.json()) as PSIResult
  await write(k, { ts: now(), data: j })
  return j
}

export const getPSIKey = (userKey: string | null | undefined): string => {
  const trimmed = (userKey || '').trim()
  return trimmed || DEFAULT_PSI_KEY
}

export const isUsingDefaultPSIKey = (userKey: string | undefined): boolean => {
  return !userKey || userKey.trim() === ''
}

