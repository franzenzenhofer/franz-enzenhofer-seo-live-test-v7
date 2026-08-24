let tabId: number | null = null

export const contentTabId = new Promise<number>((resolve, reject) => {
  chrome.runtime.sendMessage('tabIdPls', (response) => {
    if (response?.tabId) {
      tabId = response.tabId
      resolve(response.tabId)
      return
    }
    reject(new Error('Failed to get tabId from background'))
  })
})

export const getContentTabId = () => tabId
