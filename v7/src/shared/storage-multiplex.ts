// One process-wide chrome.storage.onChanged listener that fans out to per-key
// subscribers. Replaces the previous pattern where every React hook registered
// its own listener, which produced N listeners for the same key and risked
// add-before-remove races on rapid remount.

type Area = 'local' | 'sync' | 'session' | 'managed'
type Handler = (newValue: unknown, oldValue: unknown, area: Area) => void

const subscribers = new Map<string, Set<Handler>>()
let installed = false

const onChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
  for (const [key, change] of Object.entries(changes)) {
    const set = subscribers.get(key)
    if (!set || !set.size) continue
    for (const h of set) {
      try { h(change.newValue, change.oldValue, areaName as Area) }
      catch (err) { console.warn('[storage-mux] handler threw', key, err) }
    }
  }
}

const ensureInstalled = (): void => {
  if (installed) return
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return
  chrome.storage.onChanged.addListener(onChange)
  installed = true
}

export const subscribeStorage = (key: string, handler: Handler): () => void => {
  ensureInstalled()
  let set = subscribers.get(key)
  if (!set) { set = new Set(); subscribers.set(key, set) }
  set.add(handler)
  return () => {
    const cur = subscribers.get(key)
    if (!cur) return
    cur.delete(handler)
    if (!cur.size) subscribers.delete(key)
  }
}

// Test-only accessor; allows tests to assert how many subscriptions exist
// without poking at module internals from the call site.
export const __mux = {
  count: (key: string) => subscribers.get(key)?.size ?? 0,
  installed: () => installed,
  reset: () => { subscribers.clear(); installed = false },
}
