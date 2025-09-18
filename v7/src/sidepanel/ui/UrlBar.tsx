import { useCallback } from 'react'

export const UrlBar = ({ url }: { url: string }) => {
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
  }, [url])
  const open = useCallback(async () => {
    try { await chrome.tabs.create({ url }) } catch { /* ignore */ }
  }, [url])
  return (
    <div className="flex items-center gap-2">
      <span className="k w-10 shrink-0">URL</span>
      <span className="v truncate" title={url}>
        <a className="underline decoration-slate-300" href={url} onClick={(e)=>{ e.preventDefault(); open() }}>{url}</a>
      </span>
      <span className="ml-auto flex gap-1">
        <button className="text-xs underline" onClick={copy}>Copy</button>
        <button className="text-xs underline" onClick={open}>Open</button>
      </span>
    </div>
  )
}

