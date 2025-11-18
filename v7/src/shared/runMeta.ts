import type { RunStatus } from './runStatus'

export type RunMeta = { url: string; ranAt: string; runId: string; status: RunStatus }

const metaKey = (tabId: number) => `results-meta:${tabId}`
const LAST_KEY = 'ui:lastRun'

export const readRunMeta = async (tabId: number): Promise<RunMeta | null> => {
  const key = metaKey(tabId)
  const { [key]: raw } = await chrome.storage.local.get(key)
  return (raw as RunMeta) || null
}

export const watchRunMeta = (tabId: number, cb: (meta: RunMeta | null) => void) => {
  const key = metaKey(tabId)
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[key]) {
      cb((changes[key].newValue as RunMeta) || null)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

export const readLastRunMeta = async (): Promise<(RunMeta & { tabId?: number }) | null> => {
  const { [LAST_KEY]: raw } = await chrome.storage.local.get(LAST_KEY)
  return (raw as RunMeta & { tabId?: number }) || null
}

export const writeRunMeta = async (tabId: number, meta: RunMeta) => {
  await chrome.storage.local.set({
    [metaKey(tabId)]: meta,
    [LAST_KEY]: { ...meta, tabId },
  })
}

export const clearRunMeta = async (tabId: number) => {
  await chrome.storage.local.remove(metaKey(tabId))
}
