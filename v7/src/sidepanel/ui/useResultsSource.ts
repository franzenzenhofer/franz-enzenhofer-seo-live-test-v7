import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, filterResultsByRunId, type Result } from '@/shared/results'
import { readRunMeta, readLastRunMeta, watchRunMeta, type RunMeta } from '@/shared/runMeta'
import { Logger } from '@/shared/logger'

export const useResultsSource = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [items, setItems] = useState<Result[]>([])
  const [meta, setMeta] = useState<RunMeta | null>(null)
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

  // Subscribe to runMeta for current tab to get full metadata
  useEffect(() => {
    let unsub: (() => void) | null = null
    let cancelled = false
    const boot = async () => {
      if (!tabId) {
        const last = await readLastRunMeta().catch(() => null)
        if (!cancelled) setMeta(last)
        return
      }
      const initial = await readRunMeta(tabId).catch(() => null)
      if (!cancelled) setMeta(initial)
      unsub = watchRunMeta(tabId, (next) => setMeta(next))
    }
    boot().catch(() => {})
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [tabId, refreshKey])

  return { tabId, items: filterResultsByRunId(items, meta?.runId), meta }
}
