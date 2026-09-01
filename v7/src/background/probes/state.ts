import type { RedirectHop } from '@/shared/redirectChainTypes'

export type ProbeRecord = {
  id: string
  url: string
  hops: RedirectHop[]
  requestId?: string
  done: boolean
  waiters: Array<() => void>
  purge: ReturnType<typeof setTimeout>
}

const records = new Map<string, ProbeRecord>()

const stripHash = (url: string): string => url.split('#')[0] ?? url

export const probeCount = (): number => records.size

export const createProbe = (
  url: string, lifetimeMs: number, onExpire: (record: ProbeRecord) => void,
): ProbeRecord => {
  const id = `probe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const record: ProbeRecord = {
    id, url: stripHash(url), hops: [], done: false, waiters: [],
    purge: setTimeout(() => onExpire(record), lifetimeMs),
  }
  records.set(id, record)
  return record
}

export const getProbe = (id: string): ProbeRecord | undefined => records.get(id)

export const removeProbe = (id: string): void => {
  const record = records.get(id)
  if (!record) return
  clearTimeout(record.purge)
  records.delete(id)
}

export const probeByRequestId = (requestId: string): ProbeRecord | undefined => {
  for (const record of records.values()) {
    if (record.requestId === requestId) return record
  }
  return undefined
}

/**
 * The oldest unclaimed, unfinished probe waiting for this URL claims the
 * request; every later event routes by requestId, so concurrent probes -
 * even for the same URL - never cross-talk.
 */
export const claimProbe = (url: string, requestId: string): ProbeRecord | undefined => {
  const wanted = stripHash(url)
  for (const record of records.values()) {
    if (!record.requestId && !record.done && record.url === wanted) {
      record.requestId = requestId
      return record
    }
  }
  return undefined
}

export const finishProbe = (record: ProbeRecord): void => {
  if (record.done) return
  record.done = true
  record.waiters.splice(0).forEach((wake) => wake())
}
