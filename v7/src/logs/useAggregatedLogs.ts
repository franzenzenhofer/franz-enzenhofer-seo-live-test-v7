import { useEffect, useState } from 'react'

import { getAllLogs } from '@/shared/logs'

export const useAggregatedLogs = () => {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const load = () => getAllLogs().then((entries) => { if (!cancelled) setLogs(entries) })
    load()

    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'session' && Object.keys(c).some((k) => k.startsWith('logs:'))) load()
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => {
      cancelled = true
      chrome.storage.onChanged.removeListener(onChange)
    }
  }, [])

  return logs
}
