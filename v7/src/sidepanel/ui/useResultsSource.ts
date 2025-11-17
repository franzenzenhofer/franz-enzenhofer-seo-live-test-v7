import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'
import { Logger } from '@/shared/logger'

export const useResultsSource = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [items, setItems] = useState<Result[]>([])

  // Listen for tab activation changes AND navigation within tab
  useEffect(() => {
    let currentTabId: number | null = null

    const onActivated = (info: chrome.tabs.TabActiveInfo) => {
      currentTabId = info.tabId
      setTabId(info.tabId)
    }

    const onUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      // Only trigger if it's the current active tab AND URL changed
      if (updatedTabId === currentTabId && changeInfo.url) {
        setTabId(updatedTabId) // Force re-subscribe to results
      }
    }

    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)

    // Get initial active tab
    getActiveTabId()
      .then((id) => {
        if (id) {
          currentTabId = id
          setTabId(id)
        }
      })
      .catch(() => {})

    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
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
