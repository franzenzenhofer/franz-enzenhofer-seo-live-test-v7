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

/**
 * Filter results to only those matching a specific runId.
 * Results without runIdentifier are excluded when filtering.
 *
 * @param results - All results to filter
 * @param runId - The runId to filter by (undefined = no filtering)
 * @returns Filtered results array
 */
export const filterResultsByRunId = (results: Result[], runId: string | undefined): Result[] => {
  if (!runId) return results
  return results.filter((r) => r.runIdentifier === runId)
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

/**
 * Keep only results from the last N unique runIds.
 * Results without runIdentifier are discarded.
 *
 * @param results - All results to clean
 * @param keepLastN - Number of most recent runs to keep (default 3)
 * @returns Cleaned results array
 */
export const cleanupOldResults = (results: Result[], keepLastN = 3): Result[] => {
  if (!results.length) return []
  const withRunId = results.filter((r) => r.runIdentifier)
  if (!withRunId.length) return []
  const uniqueRunIds = Array.from(new Set(withRunId.map((r) => r.runIdentifier!)))
  const recentRunIds = uniqueRunIds.slice(-keepLastN)
  return withRunId.filter((r) => recentRunIds.includes(r.runIdentifier!))
}

/**
 * Find results for a specific runId by searching ALL tabs.
 * @param runId - The runId to search for
 * @returns Object with tabId and filtered results, or null if not found
 */
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
