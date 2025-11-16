const send = <T = unknown>(tabId: number, msg: unknown): Promise<T | null> =>
  new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, msg, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null)
        return
      }
      resolve(response as T)
    })
  })

export const highlightSelector = async (tabId: number, selectors: string[]): Promise<{ ok: boolean; selector?: string }> => {
  for (const selector of selectors) {
    const res = await send<{ ok?: boolean }>(tabId, { type: 'highlight-selector', selector })
    if (res?.ok) return { ok: true, selector }
  }
  return { ok: false }
}

export const clearHighlight = (tabId: number) => send(tabId, { type: 'clear-highlight' }).then(() => {}).catch(() => {})
