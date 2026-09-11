import { getActiveTabId } from '@/shared/chrome'

export type ActiveTabSource = 'initial' | 'activated'
export type ActiveTabHandlers = {
  onTab: (tabId: number | null, source: ActiveTabSource) => void
  /** The active tab's URL changed in place (tabs.onUpdated changeInfo.url) - a load or a history update. */
  onUrl?: (tabId: number, url: string) => void
}

/**
 * One subscription to "which tab does the panel stand for": the active tab at
 * mount, every activation, and every URL change of that tab. Shared by the
 * results source and the current-page URL so both follow the same tab.
 * https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onUpdated
 */
export const subscribeActiveTab = ({ onTab, onUrl }: ActiveTabHandlers): (() => void) => {
  let current: number | null = null
  const onActivated = (info: chrome.tabs.TabActiveInfo) => {
    current = info.tabId
    onTab(info.tabId, 'activated')
  }
  const onUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (tabId === current && changeInfo.url) onUrl?.(tabId, changeInfo.url)
  }
  chrome.tabs.onActivated.addListener(onActivated)
  chrome.tabs.onUpdated.addListener(onUpdated)
  getActiveTabId()
    .then((id) => { current = id || null; onTab(current, 'initial') })
    .catch(() => { onTab(null, 'initial') })
  return () => {
    chrome.tabs.onActivated.removeListener(onActivated)
    chrome.tabs.onUpdated.removeListener(onUpdated)
  }
}
