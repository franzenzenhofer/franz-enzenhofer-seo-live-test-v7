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
