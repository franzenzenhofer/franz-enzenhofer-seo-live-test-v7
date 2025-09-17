export type Result = { name: string; label: string; message: string; type: string; priority?: number }

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

