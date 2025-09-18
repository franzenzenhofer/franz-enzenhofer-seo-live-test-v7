export const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id ?? null
}

const isRestricted = (u?: string) => Boolean(u && /^(chrome|edge|about|devtools|view-source|chrome-extension):/i.test(u))

const contentScriptFiles = (): string[] => {
  const m = chrome.runtime.getManifest()
  const files = (m.content_scripts || []).flatMap((cs) => cs.js || [])
  return Array.from(new Set(files))
}

export const sendToTab = async <T>(tabId: number, type: string): Promise<T> => {
  await chrome.storage.session.set({ lastActiveTab: tabId }).catch(() => {})
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type })
    return res as T
  } catch {
    // If the content script isn't injected (e.g., tab was open before install), inject and retry once
    // using whatever files are declared in the manifest (built asset paths in prod).
    const files = contentScriptFiles()
    if (!files.length) throw new Error('No content scripts declared')
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (isRestricted(tab?.url)) throw new Error('Cannot access a chrome:// URL')
    await chrome.storage.session.set({ [`inject:${tabId}`]: files }).catch(() => {})
    await chrome.scripting.executeScript({ target: { tabId }, files })
    const res = await chrome.tabs.sendMessage(tabId, { type })
    return res as T
  }
}

export const injectForTab = async (tabId: number) => {
  const files = contentScriptFiles()
  if (!files.length) return
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (isRestricted(tab?.url)) throw new Error('Cannot access a chrome:// URL')
  await chrome.scripting.executeScript({ target: { tabId }, files })
}

export const getPageInfoFromActive = async <T>() => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')
  return sendToTab<T>(tabId, 'getPageInfo')
}
