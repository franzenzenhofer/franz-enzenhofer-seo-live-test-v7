import { clearLedger } from './history/listeners'
import { clearFinalize } from './pipeline/alarms'
import { resetRun } from './pipeline/store'
import { abortSession } from './rules/sessions'

import { clearLogsFromSession } from '@/shared/logStore'
import { runMetaKey } from '@/shared/runMeta'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export const CLOSED_TAB_LIMIT = 20

const clearPendingResults = async (tabId: number): Promise<void> => {
  const key = `results:${tabId}`
  const stored = await chrome.storage.local.get(key)
  if (!Array.isArray(stored[key])) return
  const results = stored[key] as Array<{ type?: string }>
  const terminal = results.filter((result) => result.type !== 'pending')
  if (terminal.length !== results.length) await chrome.storage.local.set({ [key]: terminal })
}

export const clearTabSessionState = async (tabId: number, reason: string): Promise<void> => {
  await Promise.all([
    clearFinalize(tabId),
    resetRun(tabId),
    abortSession(tabId, reason),
    clearLogsFromSession(tabId),
    clearLedger(tabId),
    clearPendingResults(tabId),
  ])
}

const retainClosedResults = async (tabId: number): Promise<void> => {
  const key = STORAGE_KEYS.RESULTS.CLOSED_TABS
  const stored = await chrome.storage.local.get(key)
  const previous = Array.isArray(stored[key]) ? stored[key] as number[] : []
  const ordered = [...previous.filter((id) => id !== tabId), tabId]
  const evicted = ordered.slice(0, -CLOSED_TAB_LIMIT)
  const retained = ordered.slice(-CLOSED_TAB_LIMIT)
  if (evicted.length) {
    await chrome.storage.local.remove(evicted.flatMap((id) => [`results:${id}`, runMetaKey(id)]))
  }
  await chrome.storage.local.set({ [key]: retained })
}

export const cleanupClosedTab = async (tabId: number): Promise<void> => {
  await clearTabSessionState(tabId, 'tab-closed')
  await retainClosedResults(tabId)
}
