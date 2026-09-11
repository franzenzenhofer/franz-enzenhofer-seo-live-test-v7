import { Logger } from './logger'

const runInPage = async <T>(tabId: number, func: () => Promise<T>) => {
  const [frame] = await chrome.scripting.executeScript({ target: { tabId }, func })
  return frame?.result as T | undefined
}

export const clearServiceWorkers = async (tabId: number): Promise<void> => {
  await Logger.logDirect(tabId, 'cache', 'clear-sw start', { tabId })
  const count = await runInPage(tabId, async () => {
    if (!navigator.serviceWorker) return 0
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
    return registrations.length
  })
  await Logger.logDirect(tabId, 'cache', 'clear-sw done', { count: count || 0 })
}

export const clearCacheStorage = async (tabId: number): Promise<void> => {
  await Logger.logDirect(tabId, 'cache', 'clear-storage start', { tabId })
  const count = await runInPage(tabId, async () => {
    if (!('caches' in window)) return 0
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
    return names.length
  })
  await Logger.logDirect(tabId, 'cache', 'clear-storage done', { count: count || 0 })
}

// A page that refuses scripting (error page, viewer) still gets its reload; the
// failure stays visible in the tab log and the console instead of blocking the run.
const clearPageCaches = async (tabId: number): Promise<void> => {
  try {
    await clearServiceWorkers(tabId)
    await clearCacheStorage(tabId)
  } catch (error) {
    console.warn('[hardRefresh] cache clearing failed:', error)
    await Logger.logDirect(tabId, 'cache', 'clear failed', { error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * One document load per Run test. `tabs.reload({ bypassCache: true })` is the
 * only navigation Chrome offers that skips the HTTP cache, and it can only load
 * the tab's current URL; `tabs.update({ url })` has no cache option
 * (https://developer.chrome.com/docs/extensions/reference/api/tabs#method-reload,
 * https://developer.chrome.com/docs/extensions/reference/api/tabs#method-update).
 * Navigating first and reloading afterwards produced two documents racing for
 * one run, so a different URL gets exactly one plain navigation instead.
 * Service workers and CacheStorage are per origin and reachable only through a
 * document of that origin, so they are cleared from the current document, BEFORE
 * the load, and only when the target shares its origin.
 */
export type HardRefreshPlan = { navigation: 'reload' | 'navigate'; clearCaches: boolean; target: string }

// The panel validates its field (runNow.normalizeRunUrl) before this runs; a
// malformed URL here is a programming error and fails with a message that says so.
const parseUrl = (value: string, role: string) => {
  try {
    return new URL(value)
  } catch {
    throw new Error(`Run test: ${role} is not a valid URL: ${value}`)
  }
}

export const planHardRefresh = (currentUrl: string | undefined, url?: string): HardRefreshPlan => {
  if (!url) return { navigation: 'reload', clearCaches: true, target: currentUrl || '' }
  const target = parseUrl(url, 'the target')
  const current = currentUrl ? parseUrl(currentUrl, 'the tab URL') : null
  if (current && current.href === target.href) return { navigation: 'reload', clearCaches: true, target: current.href }
  return { navigation: 'navigate', clearCaches: current?.origin === target.origin, target: url }
}

export const hardRefreshTab = async (tabId: number, url?: string): Promise<HardRefreshPlan> => {
  const start = performance.now()
  const tab = await chrome.tabs.get(tabId)
  const plan = planHardRefresh(tab.url, url)
  await Logger.logDirect(tabId, 'cache', 'hard-refresh', { status: 'start', ...plan })
  if (plan.clearCaches) await clearPageCaches(tabId)
  else await Logger.logDirect(tabId, 'cache', 'clear skipped', { reason: 'cross-origin target', target: plan.target })
  if (plan.navigation === 'reload') await chrome.tabs.reload(tabId, { bypassCache: true })
  else await chrome.tabs.update(tabId, { url: plan.target })
  const duration = (performance.now() - start).toFixed(2)
  await Logger.logDirect(tabId, 'cache', 'hard-refresh', { status: 'complete', navigation: plan.navigation, duration: `${duration}ms` })
  return plan
}
