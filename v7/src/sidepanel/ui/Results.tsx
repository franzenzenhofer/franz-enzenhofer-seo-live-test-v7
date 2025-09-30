import { useEffect, useMemo, useState } from 'react'

import { ExportButtons } from './ExportButtons'
import { NoResults } from './NoResults'
import { ResultItem } from './ResultItem'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'
import { getResultColor } from '@/shared/colors'

export const Results = ({ types, q }: { types?: string[]; q?: string }) => {
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
  const vis = useMemo(()=> items.filter(i=> {
    if (types && !types.includes(i.type)) return false
    if (q && !`${i.label} ${i.message}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [items, types, q])
  const summary = useMemo(() => vis.reduce((s, r) => {
    s[r.type] = (s[r.type] || 0) + 1; return s
  }, {} as Record<string, number>), [vis])
  const rows = useMemo(()=> vis.map((r)=> ({ label:r.label, message:r.message, type:r.type })), [vis])
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        {['error', 'warn', 'info', 'ok'].map(type => {
          const count = summary[type] || 0
          if (count === 0) return null
          const color = getResultColor(type)
          return (
            <span key={type} className={`px-2 py-1 rounded ${color.badge}`}>
              {type}: {count}
            </span>
          )
        })}
        <ExportButtons rows={rows} />
      </div>
      {vis.map((r, i) => (
        <ResultItem key={i} result={r} index={items.indexOf(r)} />
      ))}
      {!vis.length && <NoResults items={items} types={types} q={q} />}
    </div>
  )
}
