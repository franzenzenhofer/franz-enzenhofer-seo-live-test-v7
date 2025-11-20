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

export const highlightSelectors = async (
  tabId: number,
  selectors: string[],
  colors?: string[],
): Promise<{ ok: boolean; matched: number; first?: string }> => {
  const res = await send<{ ok?: boolean; matched?: number; first?: string }>(tabId, {
    type: 'highlight-selector',
    selectors,
    colors,
  })
  return { ok: Boolean(res?.ok), matched: res?.matched ?? 0, first: res?.first }
}

export const clearHighlight = (tabId: number) => send(tabId, { type: 'clear-highlight' }).then(() => {}).catch(() => {})
