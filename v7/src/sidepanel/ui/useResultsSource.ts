import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, filterResultsByRunId, type Result } from '@/shared/results'
import { readRunMeta, watchRunMeta } from '@/shared/runMeta'
import { Logger } from '@/shared/logger'

export const useResultsSource = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [items, setItems] = useState<Result[]>([])
  const [runId, setRunId] = useState<string | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)

  // Listen for tab activation changes AND navigation within tab
  useEffect(() => {
    let currentTabId: number | null = null

    const onActivated = (info: chrome.tabs.TabActiveInfo) => {
      currentTabId = info.tabId
      setTabId(info.tabId)
      setRefreshKey((k) => k + 1)
    }

    const onUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === currentTabId && changeInfo.url) {
        setRefreshKey((k) => k + 1)
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
    readResults(tabId).then(setItems).catch(() => {})
    unsub = watchResults(tabId, setItems)
    return () => { unsub?.() }
  }, [tabId, refreshKey])

  // Subscribe to runMeta for current tab to get runId
  useEffect(() => {
    if (!tabId) {
      setRunId(undefined)
      return
    }
    let unsub: (() => void) | null = null
    readRunMeta(tabId).then((meta) => setRunId(meta?.runId)).catch(() => {})
    unsub = watchRunMeta(tabId, (meta) => setRunId(meta?.runId))
    return () => { unsub?.() }
  }, [tabId, refreshKey])

  return { tabId, items: filterResultsByRunId(items, runId) }
}
