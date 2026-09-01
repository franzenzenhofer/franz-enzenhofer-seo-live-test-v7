export type GscProperty = { property: string; type: 'url-prefix' | 'domain' }
type Cached = { at: number; value: GscProperty | null }

/** A lightweight access probe. If Google has not answered by now it never will. */
export const GSC_PROBE_TIMEOUT_MS = 8_000
const HIT_TTL_MS = 30 * 60_000
// A miss is cached too: auditing a site you do not own (the common case) would
// otherwise re-probe on every single run, forever.
const MISS_TTL_MS = 10 * 60_000

const memory = new Map<string, Cached>()
const inFlight = new Map<string, Promise<GscProperty | null>>()
const storeKey = (host: string) => `gsc:property:${host}`

const fresh = (entry: Cached | undefined): entry is Cached => {
  if (!entry) return false
  return Date.now() - entry.at < (entry.value ? HIT_TTL_MS : MISS_TTL_MS)
}

const readCache = async (host: string): Promise<Cached | undefined> => {
  const local = memory.get(host)
  if (fresh(local)) return local
  try {
    const { [storeKey(host)]: stored } = await chrome.storage.session.get(storeKey(host))
    const entry = stored as Cached | undefined
    if (fresh(entry)) { memory.set(host, entry); return entry }
  } catch { /* no session storage outside the extension */ }
  return undefined
}

const writeCache = async (host: string, value: GscProperty | null) => {
  const entry: Cached = { at: Date.now(), value }
  memory.set(host, entry)
  try { await chrome.storage.session.set({ [storeKey(host)]: entry }) } catch { /* ignore */ }
}

const probe = async (property: string, token: string): Promise<boolean> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GSC_PROBE_TIMEOUT_MS)
  try {
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: '2024-01-01', endDate: '2024-01-01', rowLimit: 1 }),
        signal: controller.signal,
      },
    )
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

const resolve = async (url: string, token: string, host: string): Promise<GscProperty | null> => {
  const parsed = new URL(url)
  const urlPrefix = `${parsed.origin}/`
  const domainProperty = `sc-domain:${parsed.hostname.replace(/^www\./, '')}`
  // Probed together: a domain-property account always fails the url-prefix
  // probe first, so probing in sequence paid that round trip before starting
  // the one that works. url-prefix still wins when both resolve.
  const [prefixOk, domainOk] = await Promise.all([probe(urlPrefix, token), probe(domainProperty, token)])
  const value: GscProperty | null = prefixOk
    ? { property: urlPrefix, type: 'url-prefix' }
    : domainOk ? { property: domainProperty, type: 'domain' } : null
  await writeCache(host, value)
  return value
}

/**
 * All six GSC rules ask for this at once. Without single-flight each paid two
 * authenticated round trips; without a timeout an unresponsive Google left all
 * six showing "Running..." until the 60 s rule timeout.
 */
export const deriveGscProperty = async (url: string, token: string): Promise<GscProperty | null> => {
  const host = new URL(url).hostname
  const cached = await readCache(host)
  if (cached) return cached.value
  const pending = inFlight.get(host)
  if (pending) return pending
  const task = resolve(url, token, host).finally(() => { inFlight.delete(host) })
  inFlight.set(host, task)
  return task
}
