const key = (tabId: number) => `logs:${tabId}`

export const SYSTEM_TAB_ID = 0

export const isValidTabId = (tabId: number | null | undefined): tabId is number => Number.isInteger(tabId) && Number(tabId) > 0

export const ensureTabId = (tabId: number) => {
  if (!isValidTabId(tabId)) throw new Error(`[logs] Invalid tabId: ${tabId}`)
}

export const hasSessionAccess = () => typeof chrome !== 'undefined' && !!chrome?.storage?.session

const getSessionArea = () => {
  if (!hasSessionAccess()) throw new Error('[logs] chrome.storage.session is unavailable in this context')
  return chrome.storage.session!
}

const MAX_LOG_ENTRIES = 3000

const readRawLogs = async (tabId: number) => {
  const area = getSessionArea()
  const { [key(tabId)]: logs } = await area.get(key(tabId))
  return Array.isArray(logs) ? logs : []
}

const appendRawLogEntry = async (tabId: number, entry: string) => {
  const prev = await readRawLogs(tabId)
  const area = getSessionArea()
  const next = [...prev, entry]
  const trimmed = next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next
  await area.set({ [key(tabId)]: trimmed })
}

const clearRawLogs = async (tabId: number) => {
  const area = getSessionArea()
  await area.remove(key(tabId))
}

export const readLogsFromSession = async (tabId: number) => {
  ensureTabId(tabId)
  return readRawLogs(tabId)
}

export const readSystemLogsFromSession = async () => readRawLogs(SYSTEM_TAB_ID)

export const appendLogEntry = async (tabId: number, entry: string) => {
  ensureTabId(tabId)
  await appendRawLogEntry(tabId, entry)
}

export const appendSystemLogEntry = async (entry: string) => appendRawLogEntry(SYSTEM_TAB_ID, entry)

export const clearLogsFromSession = async (tabId: number) => {
  ensureTabId(tabId)
  await clearRawLogs(tabId)
}

export const clearSystemLogsFromSession = async () => clearRawLogs(SYSTEM_TAB_ID)
