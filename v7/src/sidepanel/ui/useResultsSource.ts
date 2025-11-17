import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'
import { Logger } from '@/shared/logger'

export const useResultsSource = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [items, setItems] = useState<Result[]>([])

  // Listen for tab activation changes
  useEffect(() => {
    const onActivated = (info: chrome.tabs.TabActiveInfo) => {
      setTabId(info.tabId)
    }

    chrome.tabs.onActivated.addListener(onActivated)

    // Get initial active tab
    getActiveTabId()
      .then((id) => {
        if (id) setTabId(id)
      })
      .catch(() => {})

    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
    }
  }, [])

  // Subscribe to results for current tab
  useEffect(() => {
    if (!tabId) return

    Logger.setTabId(tabId)

    let unsub: (() => void) | null = null

    readResults(tabId)
      .then(setItems)
      .catch(() => {})

    unsub = watchResults(tabId, setItems)

    return () => {
      unsub?.()
    }
  }, [tabId])

  return { tabId, items }
}
