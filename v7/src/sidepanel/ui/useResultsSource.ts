import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'

export const useResultsSource = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [items, setItems] = useState<Result[]>([])

  useEffect(() => {
    let unsub: (() => void) | null = null
    getActiveTabId()
      .then((id) => {
        setTabId(id)
        if (!id) return
        readResults(id).then(setItems).catch(() => {})
        unsub = watchResults(id, setItems)
      })
      .catch(() => {})
    return () => { unsub?.() }
  }, [])

  return { tabId, items }
}
