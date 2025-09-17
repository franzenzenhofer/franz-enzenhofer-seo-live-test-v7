export const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id ?? null
}

export const sendToTab = async <T>(tabId: number, type: string): Promise<T> => {
  const res = await chrome.tabs.sendMessage(tabId, { type })
  return res as T
}

export const getPageInfoFromActive = async <T>() => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')
  return sendToTab<T>(tabId, 'getPageInfo')
}

