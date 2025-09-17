export const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id ?? null
}

export const sendToTab = async <T>(tabId: number, type: string): Promise<T> => {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type })
    return res as T
  } catch {
    // If the content script isn't injected (e.g., tab was open before install), inject and retry once.
    await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/index.ts'] })
    const res = await chrome.tabs.sendMessage(tabId, { type })
    return res as T
  }
}

export const getPageInfoFromActive = async <T>() => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')
  return sendToTab<T>(tabId, 'getPageInfo')
}
