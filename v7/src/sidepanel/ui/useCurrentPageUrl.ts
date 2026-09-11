import { useEffect, useState } from 'react'

import { subscribeActiveTab } from './activeTab'

/**
 * The URL the active tab is on right now - `tabs.Tab.url`, "the last committed
 * URL of the main frame of the tab", which follows history.pushState too
 * (https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab).
 * The run meta only knows the URL of the last run; after an in-page navigation
 * the two differ, and the panel must show the page, not the run.
 */
export const useCurrentPageUrl = (): string | null => {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => subscribeActiveTab({
    onTab: (tabId) => {
      if (!tabId) { setUrl(null); return }
      chrome.tabs.get(tabId).then((tab) => setUrl(tab.url || null)).catch(() => setUrl(null))
    },
    onUrl: (_tabId, next) => setUrl(next),
  }), [])
  return url
}
