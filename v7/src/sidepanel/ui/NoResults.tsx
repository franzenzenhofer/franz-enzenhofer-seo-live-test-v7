import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { getLogs } from '@/shared/logs'

export const NoResults = ({ items, types, q }: { items: unknown[]; types?: string[]; q?: string }) => {
  const [dbg, setDbg] = useState<{ pageUrl?: string; evCount?: number; tail?: unknown[] } | null>(null)
  const [last, setLast] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      const id = await getActiveTabId(); if (!id) return
      const k = `debug:last-run:${id}`; const m = await chrome.storage.session.get(k); const v = (m as unknown as Record<string, unknown>)[k] as { pageUrl?: string; evCount?: number; tail?: unknown[] } | undefined; setDbg(v || null)
      const L = await getLogs(id); setLast(L.slice(-6))
    })().catch(() => {})
  }, [])
  const info = items.length ? 'All results are filtered out.' : 'No results have been saved yet.'
  const f = (types || []).join(',') || 'all'
  const dump = () => {
    const blob = new Blob([JSON.stringify({ summary:{ total:items.length, visible:0, types:f, q }, lastRun:dbg, lastLogs:last }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'livetest-debug.json'; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <div className="text-sm text-slate-600 space-y-1">
      <div>{info}</div>
      <div>Filters: {f}; Query: {q?.length ? 'yes' : 'no'}</div>
      {dbg && <div>Last run: url={dbg.pageUrl||'(none)'} ev={dbg.evCount||0}</div>}
      {last.length>0 && <pre className="text-[10px] bg-slate-50 p-2 border rounded max-h-32 overflow-auto">{last.join('\n')}</pre>}
      <button onClick={dump} className="text-xs underline">Export debug snapshot</button>
    </div>
  )
}
