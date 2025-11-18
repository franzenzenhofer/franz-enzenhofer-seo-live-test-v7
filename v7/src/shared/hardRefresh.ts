import { Logger } from './logger'

export const clearServiceWorkers = async (tabId: number): Promise<void> => {
  try {
    await Logger.logDirect(tabId, 'cache', 'clear-sw start', { tabId })
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        if (!navigator.serviceWorker) return 0
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
        return registrations.length
      },
    })
    const count = result[0]?.result || 0
    await Logger.logDirect(tabId, 'cache', 'clear-sw done', { count })
  } catch (error) {
    console.warn('[hardRefresh] clearServiceWorkers failed:', error)
    await Logger.logDirect(tabId, 'cache', 'clear-sw failed', { error: error instanceof Error ? error.message : String(error) })
  }
}

export const clearCacheStorage = async (tabId: number): Promise<void> => {
  try {
    await Logger.logDirect(tabId, 'cache', 'clear-storage start', { tabId })
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        if (!('caches' in window)) return 0
        const names = await caches.keys()
        await Promise.all(names.map((name) => caches.delete(name)))
        return names.length
      },
    })
    const count = result[0]?.result || 0
    await Logger.logDirect(tabId, 'cache', 'clear-storage done', { count })
  } catch (error) {
    console.warn('[hardRefresh] clearCacheStorage failed:', error)
    await Logger.logDirect(tabId, 'cache', 'clear-storage failed', { error: error instanceof Error ? error.message : String(error) })
  }
}

export const hardRefreshTab = async (tabId: number, url?: string): Promise<void> => {
  const start = performance.now()
  await Logger.logDirect(tabId, 'cache', 'hard-refresh', { status: 'start', url: url || 'current' })
  if (url) {
    await new Promise<void>(resolve => {
      const listener = (details: chrome.webNavigation.WebNavigationCallbackDetails & { frameId: number }) => {
        if (details.tabId === tabId && details.frameId === 0) {
          chrome.webNavigation.onCommitted.removeListener(listener)
          resolve()
        }
      }
      chrome.webNavigation.onCommitted.addListener(listener)
      chrome.tabs.update(tabId, { url }).catch(() => {
        chrome.webNavigation.onCommitted.removeListener(listener)
        resolve()
      })
      setTimeout(() => {
        chrome.webNavigation.onCommitted.removeListener(listener)
        resolve()
      }, 5000) // Timeout to prevent hanging
    })
  }
  try {
    await clearServiceWorkers(tabId)
    await clearCacheStorage(tabId)
  } catch (error) {
    console.warn('[hardRefresh] cache clearing failed:', error)
  }
  await chrome.tabs.reload(tabId, { bypassCache: true })
  const duration = (performance.now() - start).toFixed(2)
  await Logger.logDirect(tabId, 'cache', 'hard-refresh', { status: 'complete', duration: `${duration}ms` })
}
