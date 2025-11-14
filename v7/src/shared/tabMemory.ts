const LAST_KEY = 'lastActiveTab'
const RESTRICTED = /^(chrome|edge|about|devtools|view-source|chrome-extension):/i

export const isRestrictedUrl = (url?: string) => Boolean(url && RESTRICTED.test(url))

const storeTab = async (tabId: number) => chrome.storage.session.set({ [LAST_KEY]: tabId }).catch(() => {})

const readStored = async () => {
  try {
    const { [LAST_KEY]: stored } = await chrome.storage.session.get(LAST_KEY)
    return typeof stored === 'number' ? stored : null
  } catch {
    return null
  }
}

const findRecentTab = async () => {
  try {
    const tabs = await chrome.tabs.query({ lastFocusedWindow: true })
    const match = tabs.find((tab) => tab.id && !isRestrictedUrl(tab.url))
    return match?.id ?? null
  } catch {
    return null
  }
}

export const rememberHttpTab = async (tabId: number) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    if (!tab?.id || isRestrictedUrl(tab.url)) return
    await storeTab(tab.id)
  } catch {
    // ignore lookup failures
  }
}

export const resolveActiveTabId = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id && !isRestrictedUrl(tab.url)) return tab.id
  } catch {
    // ignore query failures
  }
  const stored = await readStored()
  if (stored) return stored
  return findRecentTab()
}
