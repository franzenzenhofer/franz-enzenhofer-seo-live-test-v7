import { useEffect, useMemo, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { readResults, watchResults, type Result } from '@/shared/results'
import { toHtml } from '@/cli/report'

export const Results = ({ types }: { types?: string[] }) => {
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
  const vis = useMemo(()=> items.filter(i=> !types || types.includes(i.type)), [items, types])
  const summary = useMemo(() => {
    const s: Record<string, number> = {}
    vis.forEach((r) => { s[r.type] = (s[r.type] || 0) + 1 })
    return { ok: s['ok'] || 0, warn: s['warn'] || 0, error: s['error'] || 0, info: s['info'] || 0 }
  }, [vis])
  const download = (name: string, data: string, type: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; a.click()
  }
  const exportJson = () => download('live-test.json', JSON.stringify(vis, null, 2), 'application/json')
  const exportHtml = () => {
    const rows = vis.map((r) => ({ label: r.label, message: r.message, type: r.type }))
    download('live-test.html', toHtml(location.href, rows), 'text/html')
  }
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-600 flex items-center gap-2">
        <span>Summary:</span>
        <span>ok {summary['ok']}</span><span>warn {summary['warn']}</span><span>error {summary['error']}</span><span>info {summary['info']}</span>
        <span className="ml-auto flex gap-2"><button className="border px-1" onClick={exportJson}>Export JSON</button><button className="border px-1" onClick={exportHtml}>Export HTML</button></span>
      </div>
      {vis.map((r, i) => (
        <div key={i} className="border rounded p-2">
          <div className="text-xs text-slate-500">{r.label} · {r.type}</div>
          <div className="font-medium">{r.message}</div>
        </div>
      ))}
      {!vis.length && <p className="text-sm text-slate-500">No results yet…</p>}
    </div>
  )
}
