/**
 * Run History Storage
 * Stores metadata for all test runs across all tabs
 */

import type { RunState } from '@/background/rules/runState'

const HISTORY_KEY = 'run-history'
const MAX_HISTORY_SIZE = 100

/**
 * Read run history from storage
 */
export const readRunHistory = async (): Promise<RunState[]> => {
  const result = await chrome.storage.local.get(HISTORY_KEY)
  return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : []
}

/**
 * Append run to history (auto-trim to max size)
 */
export const appendRunHistory = async (run: RunState): Promise<void> => {
  const history = await readRunHistory()
  const updated = [...history, run]

  // Keep only the most recent MAX_HISTORY_SIZE runs
  const trimmed = updated.slice(-MAX_HISTORY_SIZE)

  await chrome.storage.local.set({ [HISTORY_KEY]: trimmed })
}

/**
 * Clear entire run history
 */
export const clearRunHistory = async (): Promise<void> => {
  await chrome.storage.local.remove(HISTORY_KEY)
}

/**
 * Get run history for specific tab
 */
export const getTabRunHistory = async (tabId: number): Promise<RunState[]> => {
  const history = await readRunHistory()
  return history.filter((run) => run.tabId === tabId)
}

/**
 * Get run history for specific URL
 */
export const getUrlRunHistory = async (url: string): Promise<RunState[]> => {
  const history = await readRunHistory()
  return history.filter((run) => run.url === url)
}

/**
 * Find run by ID
 */
export const findRunById = async (runId: string): Promise<RunState | null> => {
  const history = await readRunHistory()
  return history.find((run) => run.runId === runId) || null
}
