import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, filterResultsByRunId, type Result } from '@/shared/results'
import { readRunMeta, watchRunMeta, type RunMeta } from '@/shared/runMeta'
import { Logger } from '@/shared/logger'

export const useResultsSource = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [items, setItems] = useState<Result[]>([])
  const [meta, setMeta] = useState<RunMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    let currentTabId: number | null = null
    const onActivated = (info: chrome.tabs.TabActiveInfo) => {
      currentTabId = info.tabId
      setTabId(info.tabId)
      setLoading(true)
      setRefreshKey((k) => k + 1)
    }
    const onUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === currentTabId && changeInfo.url) { setLoading(true); setRefreshKey((k) => k + 1) }
    }
    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    getActiveTabId().then((id) => {
      if (id) { currentTabId = id; setTabId(id) } else { setLoading(false) }
    }).catch(() => { setLoading(false); return null })
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [])
  useEffect(() => {
    if (!tabId) { setItems([]); return }
    Logger.setTabId(tabId)
    let unsub: (() => void) | null = null
    void readResults(tabId).then(setItems).catch(() => { setItems([]) }).finally(() => { setLoading(false) })
    unsub = watchResults(tabId, setItems)
    return () => { unsub?.() }
  }, [tabId, refreshKey])
  useEffect(() => {
    if (!tabId) { setMeta(null); return }
    let unsub: (() => void) | null = null
    let cancelled = false
    const boot = async () => {
      const initial = await readRunMeta(tabId).catch(() => null)
      if (!cancelled) setMeta(initial)
      unsub = watchRunMeta(tabId, (next) => setMeta(next))
    }
    void boot()
    return () => { cancelled = true; unsub?.() }
  }, [tabId, refreshKey])
  return { tabId, items: filterResultsByRunId(items, meta?.runId), meta, loading }
}
