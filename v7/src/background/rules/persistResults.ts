import { dedupRunner } from './dedup'

import { Logger } from '@/shared/logger'

export interface PersistableResult {
  name?: string; message?: string; type?: string
  ruleId?: string | null; runIdentifier?: string
}

// Soft cap evicts oldest runs; hard cap throws so the caller sees the failure.
const RESULTS_SOFT_BYTES = 2 * 1024 * 1024
const RESULTS_HARD_BYTES = 8 * 1024 * 1024
const KEEP_LAST_RUNS = 3

const toBytes = (payload: unknown): number => new TextEncoder().encode(JSON.stringify(payload)).length

const uniqueRunIdsInOrder = (results: PersistableResult[]): string[] => {
  const seen = new Set<string>()
  const order: string[] = []
  for (const r of results) {
    if (r.runIdentifier && !seen.has(r.runIdentifier)) { seen.add(r.runIdentifier); order.push(r.runIdentifier) }
  }
  return order
}

const filterPrev = (prev: PersistableResult[], add: PersistableResult[]): PersistableResult[] => {
  const replacingIds = new Set(add.map((r) => r.ruleId).filter((v): v is string => typeof v === 'string' && v.length > 0))
  const replacingNames = new Set(add.map((r) => r.name).filter((v): v is string => typeof v === 'string' && v.length > 0))
  return prev.filter((item) => {
    if (item.type !== 'pending') return true
    if (typeof item.ruleId === 'string' && replacingIds.has(item.ruleId)) return false
    return !(typeof item.name === 'string' && replacingNames.has(item.name))
  })
}

const trimToLastNRuns = (results: PersistableResult[], keep: number): PersistableResult[] => {
  const order = uniqueRunIdsInOrder(results)
  if (order.length <= keep) return results
  const keepSet = new Set(order.slice(-keep))
  return results.filter((r) => !r.runIdentifier || keepSet.has(r.runIdentifier))
}

const evictUntilUnderSoftCap = (tabId: number, key: string, merged: PersistableResult[]): PersistableResult[] => {
  let current = merged
  while (toBytes(current) > RESULTS_SOFT_BYTES) {
    const order = uniqueRunIdsInOrder(current)
    if (order.length <= 1) break
    const oldest = order[0]!
    current = current.filter((r) => r.runIdentifier !== oldest)
    Logger.logDirectSend(tabId, 'storage', 'retention', { key, evicted: oldest, remainingRuns: order.length - 1 })
  }
  return current
}

export const persistResults = async (tabId: number, key: string, prev: PersistableResult[] | undefined, add: PersistableResult[]): Promise<number> => {
  const prevFiltered = filterPrev(prev || [], add)
  const merged = dedupRunner([...prevFiltered, ...add])
  const trimmed = trimToLastNRuns(merged, KEEP_LAST_RUNS)
  const capped = evictUntilUnderSoftCap(tabId, key, trimmed)
  const finalBytes = toBytes(capped)
  if (finalBytes > RESULTS_HARD_BYTES) {
    throw new Error(`Persisted results too large (${finalBytes} bytes) for ${key}; refusing to overwrite existing runs`)
  }
  try {
    await chrome.storage.local.set({ [key]: capped })
    return capped.length
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to persist results for ${key}: ${reason}`)
  }
}

export { toBytes, uniqueRunIdsInOrder, trimToLastNRuns, RESULTS_SOFT_BYTES, RESULTS_HARD_BYTES, KEEP_LAST_RUNS }
