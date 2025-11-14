import { useCallback, useMemo } from 'react'

export const UrlBar = ({ url, stale, ranAt, runId, onOpenReport }: { url: string; stale?: boolean; ranAt?: string; runId?: string; onOpenReport: () => void }) => {
  const label = url || 'No previous run yet'
  const canOpen = useMemo(() => /^https?:|^file:/i.test(url || ''), [url])
  const copy = useCallback(async () => {
    if (!url) return
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
  }, [url])
  const open = useCallback(async () => {
    if (!canOpen || !url) return
    try { await chrome.tabs.create({ url }) } catch { /* ignore */ }
  }, [canOpen, url])
  const meta = stale && url ? `Showing cached results${ranAt ? ` from ${new Date(ranAt).toLocaleString()}` : ''}.` : ''
  const runTime = ranAt ? new Date(ranAt).toLocaleString() : null
  const runLine = runTime || runId ? `Run ${runId ? `#${runId}` : 'ID unavailable'}${runTime ? ` · ${runTime}` : ''}` : ''

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="k w-10 shrink-0">URL</span>
        <span className="v truncate" title={label}>
          {canOpen ? (
            <a className="underline decoration-slate-300" href={url} onClick={(e)=>{ e.preventDefault(); open() }}>{label}</a>
          ) : (
            <span>{label}</span>
          )}
        </span>
        <span className="ml-auto flex gap-1">
          <button className="text-xs underline disabled:opacity-40" onClick={copy} disabled={!url}>Copy</button>
          <button className="text-xs underline disabled:opacity-40" onClick={open} disabled={!canOpen}>Open</button>
        </span>
      </div>
      {runLine && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600 ml-10">
          <span>{runLine}</span>
          <button className="underline" onClick={onOpenReport}>Show full report</button>
        </div>
      )}
      {meta && <p className="text-[11px] text-amber-700 ml-10">{meta}</p>}
    </div>
  )
}
