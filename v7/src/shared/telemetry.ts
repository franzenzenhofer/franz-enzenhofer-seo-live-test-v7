// Process-local counters flushed periodically to chrome.storage.session so the
// side-panel Logs view can read them without round-tripping through messages.
// Counters never leave the device; this is internal-only diagnostics.

export type CounterKey =
  | 'sw.wakeups'
  | 'msg.in'
  | 'msg.out'
  | 'fetch.fail'
  | 'storage.write'
  | 'storage.write.fail'
  | 'listeners.registered'
  | 'crashnet.fired'

const STORAGE_KEY = 'telemetry:counters'

const local = new Map<CounterKey, number>()

export const incr = (key: CounterKey, by: number = 1): void => {
  local.set(key, (local.get(key) || 0) + by)
}

export const snapshot = (): Record<CounterKey, number> => {
  const out = {} as Record<CounterKey, number>
  for (const [k, v] of local) out[k] = v
  return out
}

const flush = async (): Promise<void> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.session) return
    await chrome.storage.session.set({ [STORAGE_KEY]: snapshot() })
  } catch {
    // best-effort; counters are diagnostic only
  }
}

let started = false

export const startTelemetryFlush = (periodMinutes: number = 0.5): void => {
  if (started) return
  started = true
  if (typeof chrome === 'undefined' || !chrome.alarms) return
  chrome.alarms.create('telemetry:flush', { periodInMinutes: periodMinutes })
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === 'telemetry:flush') void flush()
  })
}

export const __test = { local, flush, STORAGE_KEY }
