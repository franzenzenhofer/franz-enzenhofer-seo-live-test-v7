import type { Result as CoreResult } from '@/core/types'

export type Result = CoreResult

const key = (tabId: number) => `results:${tabId}`

export const readResults = async (tabId: number) => {
  const { [key(tabId)]: v } = await chrome.storage.local.get(key(tabId))
  return (v as Result[]) || []
}

export const watchResults = (tabId: number, cb: (r: Result[]) => void) => {
  const h = (c: { [k: string]: chrome.storage.StorageChange }) => {
    const ch = c[key(tabId)]
    if (ch) cb((ch.newValue as Result[]) || [])
  }
  chrome.storage.onChanged.addListener(h)
  return () => chrome.storage.onChanged.removeListener(h)
}

export const clearResults = async (tabId: number) => {
  await chrome.storage.local.remove(key(tabId))
}

export const filterResultsByRunId = (results: Result[], runId: string | undefined): Result[] => {
  if (!runId) return results
  return results.filter((r) => r.runIdentifier === runId)
}

export const latestRunId = (results: Result[]): string | null => {
  const ids = results.map((r) => r.runIdentifier).filter((id): id is string => Boolean(id))
  if (!ids.length) return null
  return ids[ids.length - 1]!
}

export const isResultUnconfigured = (r: Result): boolean => {
  const msg = r.message.toLowerCase()
  return (
    msg.includes('no psi key') ||
    msg.includes('not logged in') ||
    msg.includes('no key set') ||
    msg.includes('no token') ||
    msg.includes('no api key') ||
    msg.includes('authentication required') ||
    msg.includes('auth required')
  )
}

export const cleanupOldResults = (results: Result[], keepLastN = 3): Result[] => {
  if (!results.length) return []
  const withRunId = results.filter((r) => r.runIdentifier)
  if (!withRunId.length) return []
  const uniqueRunIds = Array.from(new Set(withRunId.map((r) => r.runIdentifier!)))
  const recentRunIds = uniqueRunIds.slice(-keepLastN)
  return withRunId.filter((r) => recentRunIds.includes(r.runIdentifier!))
}

export const findResultsByRunId = async (runId: string): Promise<{ tabId: number; results: Result[] } | null> => {
  const all = await chrome.storage.local.get(null)
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith('results:') && Array.isArray(v)) {
      const results = v as Result[]
      const filtered = filterResultsByRunId(results, runId)
      if (filtered.length > 0) {
        const tabId = parseInt(k.replace('results:', ''), 10)
        return { tabId, results: filtered }
      }
    }
  }
  return null
}
