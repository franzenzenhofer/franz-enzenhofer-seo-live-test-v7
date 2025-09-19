import { useEffect, useMemo, useState } from 'react'

import { ExportButtons } from './ExportButtons'
import { NoResults } from './NoResults'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'

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
      <div className="text-xs text-slate-600 flex items-center gap-2">
        <span>ok {summary['ok']||0}</span><span>warn {summary['warn']||0}</span>
        <span>error {summary['error']||0}</span><span>info {summary['info']||0}</span>
        <ExportButtons rows={rows} />
      </div>
      {vis.map((r, i) => (
        <div key={i} className="border rounded p-2 cursor-pointer hover:bg-gray-50"
          onClick={async () => {
            const tabId = await getActiveTabId()
            if (tabId) chrome.tabs.create({ url: chrome.runtime.getURL(`report.html?tabId=${tabId}&index=${items.indexOf(r)}`) })
          }}>
          <div className="text-xs text-slate-500">{r.label} · {r.type}</div>
          <div className="font-medium">{r.message}</div>
        </div>
      ))}
      {!vis.length && <NoResults items={items} types={types} q={q} />}
    </div>
  )
}
