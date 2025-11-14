import { Logger } from './logger'

/**
 * Clear all Service Workers for the tab's origin
 */
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
    await Logger.logDirect(tabId, 'cache', 'clear-sw failed', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Clear all Cache Storage API caches for the tab's origin
 */
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
    await Logger.logDirect(tabId, 'cache', 'clear-storage failed', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Perform a hard refresh: clear Service Workers, Cache Storage, then reload
 * @param tabId - The tab ID to refresh
 * @param url - Optional URL to navigate to before refreshing
 */
export const hardRefreshTab = async (tabId: number, url?: string): Promise<void> => {
  const start = performance.now()
  await Logger.logDirect(tabId, 'cache', 'hard-refresh', { status: 'start', url: url || 'current' })

  // If URL is provided, navigate to it first
  if (url) {
    await chrome.tabs.update(tabId, { url })
    // Wait for navigation to start
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  try {
    await clearServiceWorkers(tabId)
    await clearCacheStorage(tabId)
  } catch (error) {
    console.warn('[hardRefresh] cache clearing failed:', error)
  }

  await chrome.tabs.reload(tabId, { bypassCache: true })

  const duration = (performance.now() - start).toFixed(2)
  await Logger.logDirect(tabId, 'cache', 'hard-refresh', {
    status: 'complete',
    duration: `${duration}ms`
  })
}
