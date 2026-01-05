import { useEffect, useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { getLogs } from '@/shared/logs'

type DebugSnapshot = { pageUrl?: string; evCount?: number; tail?: unknown[] }

type Props = { items: unknown[]; types?: string[]; q?: string; debugEnabled: boolean; onResetFilters?: () => void }

export const NoResults = ({ items, types, q, debugEnabled, onResetFilters }: Props) => {
  const [dbg, setDbg] = useState<DebugSnapshot | null>(null)
  const [last, setLast] = useState<string[]>([])

  useEffect(() => {
    if (!debugEnabled) {
      setDbg(null)
      setLast([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const id = await getActiveTabId()
        if (!id || cancelled) return
        const key = `debug:last-run:${id}`
        const stored = await chrome.storage.session.get(key)
        if (cancelled) return
        setDbg((stored[key] as DebugSnapshot) || null)
        const logs = await getLogs(id)
        if (!cancelled) setLast(logs.slice(-6))
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debugEnabled])

  const filteredOut = items.length > 0
  const info = filteredOut ? 'All results are filtered out.' : 'No results yet. Click Run test or press Enter to start.'
  const canReset = filteredOut && Boolean(onResetFilters)
  const filters = (types || []).join(',') || 'all'
  const dump = () => {
    if (!debugEnabled) return
    const blob = new Blob([JSON.stringify({ summary: { total: items.length, visible: 0, types: filters, q }, lastRun: dbg, lastLogs: last }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'livetest-debug.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="text-sm text-slate-600 space-y-1.5">
      <div className="flex items-center gap-2">
        <span>{info}</span>
        {canReset && (
          <button onClick={onResetFilters} className="text-xs text-blue-600 underline" type="button">
            Show all
          </button>
        )}
      </div>
      <div>
        Filters: {filters}; Query: {q?.length ? 'yes' : 'no'}
      </div>
      {debugEnabled && dbg && <div>Last run: url={dbg.pageUrl || '(none)'} ev={dbg.evCount || 0}</div>}
      {debugEnabled && last.length > 0 && (
        <pre className="text-[10px] bg-slate-50 p-2 border rounded max-h-32 overflow-auto">{last.join('\n')}</pre>
      )}
      {debugEnabled && <button onClick={dump} className="text-xs underline">Export debug snapshot</button>}
    </div>
  )
}
