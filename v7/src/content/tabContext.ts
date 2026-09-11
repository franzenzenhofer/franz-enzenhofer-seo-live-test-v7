let tabId: number | null = null

// Callback-style sendMessage: Chrome reports a failed call only through
// runtime.lastError inside the callback (e.g. "Could not establish connection.
// Receiving end does not exist." when the service worker failed to start, or
// "The message port closed before a response was received."). Not reading it
// logs "Unchecked runtime.lastError" against the extension in chrome://extensions.
// https://developer.chrome.com/docs/extensions/reference/api/runtime#property-lastError
export const contentTabId = new Promise<number>((resolve, reject) => {
  chrome.runtime.sendMessage('tabIdPls', (response?: { tabId?: number }) => {
    const err = chrome.runtime.lastError
    if (err) {
      reject(new Error(`tabIdPls failed: ${err.message}`))
      return
    }
    if (response?.tabId) {
      tabId = response.tabId
      resolve(response.tabId)
      return
    }
    reject(new Error('Failed to get tabId from background'))
  })
})

export const getContentTabId = () => tabId
