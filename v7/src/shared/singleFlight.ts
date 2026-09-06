import { raceAbort, throwIfAborted } from './abort'

type Entry<T> = { at: number; task: Promise<T>; controller: AbortController; users: number; settled: boolean }

/** Each caller can cancel independently; the underlying request stops when nobody needs it. */
export const createSingleFlight = <T>(ttlMs: number, cacheable: (value: T) => boolean = () => true) => {
  const entries = new Map<string, Entry<T>>()
  return async (key: string, run: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> => {
    throwIfAborted(signal)
    for (const [name, entry] of entries) {
      if (entry.settled && Date.now() - entry.at >= ttlMs) entries.delete(name)
    }
    let entry = entries.get(key)
    if (!entry) {
      const controller = new AbortController()
      const fresh: Entry<T> = { at: Date.now(), controller, users: 0, settled: false, task: Promise.resolve().then(() => run(controller.signal)) }
      entries.set(key, fresh)
      fresh.task = fresh.task.then((value) => {
        fresh.settled = true
        fresh.at = Date.now()
        if (!cacheable(value) && entries.get(key) === fresh) entries.delete(key)
        for (const [name, old] of entries) {
          if (entries.size <= 100) break
          if (old.settled) entries.delete(name)
        }
        return value
      }).catch((error: unknown) => {
        fresh.settled = true
        if (entries.get(key) === fresh) entries.delete(key)
        throw error
      })
      entry = fresh
    }
    entry.users++
    try { return await (signal ? raceAbort(entry.task, signal) : entry.task) }
    finally {
      entry.users--
      if (!entry.users && !entry.settled) {
        entry.controller.abort(new Error('All request consumers cancelled'))
        if (entries.get(key) === entry) entries.delete(key)
      }
    }
  }
}
