import { useEffect, useState } from 'react'

import { buildBugReport } from './bugReport'

import { getActiveTabId } from '@/shared/chrome'
import { clearLogs, getLogs } from '@/shared/logs'

export const Logs = () => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => { getActiveTabId().then(setTabId).catch(() => {}) }, [])

  useEffect(() => {
    if (!tabId) return
    const load = () => getLogs(tabId).then(setLogs)
    load()
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'session') return
      if (Object.keys(c).some((k) => k === `logs:${tabId}`)) load()
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => chrome.storage.onChanged.removeListener(onChange)
  }, [tabId])

  const copy = async () => {
    await navigator.clipboard.writeText(logs.join('\n'))
  }

  const clear = async () => {
    if (!tabId) return
    await clearLogs(tabId)
  }

  const copyReport = async () => {
    const txt = await buildBugReport().catch(()=> '')
    if (txt) await navigator.clipboard.writeText(txt)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button className="text-sm underline" onClick={copy}>Copy logs</button>
        <button className="text-sm underline" onClick={clear}>Clear logs</button>
        <button className="text-sm underline" onClick={copyReport}>Copy bug report</button>
      </div>
      <pre className="text-[10px] max-h-60 overflow-auto bg-slate-50 p-2 border border-slate-200 rounded">{logs.join('\n') || 'No logs yet.'}</pre>
    </div>
  )
}
