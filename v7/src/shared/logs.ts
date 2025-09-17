const key = (tabId: number) => `logs:${tabId}`

export const log = async (tabId: number, message: string) => {
  const ts = new Date().toISOString()
  const item = `[${ts}] ${message}`
  const { [key(tabId)]: prev } = await chrome.storage.session.get(key(tabId))
  const next = Array.isArray(prev) ? [...prev, item] : [item]
  await chrome.storage.session.set({ [key(tabId)]: next })
}

export const getLogs = async (tabId: number) => {
  const { [key(tabId)]: logs } = await chrome.storage.session.get(key(tabId))
  return Array.isArray(logs) ? logs : []
}

export const clearLogs = async (tabId: number) => {
  await chrome.storage.session.remove(key(tabId))
}

