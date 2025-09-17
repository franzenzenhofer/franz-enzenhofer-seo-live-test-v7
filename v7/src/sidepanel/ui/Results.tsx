import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'

export const Results = () => {
  const [items, setItems] = useState<Result[]>([])
  useEffect(() => {
    let unsub: (() => void) | null = null
    getActiveTabId().then((tabId) => {
      if (!tabId) return
      readResults(tabId).then(setItems).catch(() => {})
      unsub = watchResults(tabId, setItems)
    }).catch(() => {})
    return () => { unsub?.() }
  }, [])
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div key={i} className="border rounded p-2">
          <div className="text-xs text-slate-500">{r.label} · {r.type}</div>
          <div className="font-medium">{r.message}</div>
        </div>
      ))}
      {!items.length && <p className="text-sm text-slate-500">No results yet…</p>}
    </div>
  )
}
