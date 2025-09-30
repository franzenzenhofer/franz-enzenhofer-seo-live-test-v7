import { useEffect, useState } from 'react'

import { LogsHeader } from './LogsHeader'
import { LogsControls } from './LogsControls'
import { LogsDisplay } from './LogsDisplay'

import { clearLogs, getLogs } from '@/shared/logs'

export const LogsView = ({ tabId }: { tabId: number | null }) => {
  const [logs, setLogs] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)

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

  useEffect(() => {
    if (autoScroll) {
      const element = document.getElementById('logs-container')
      if (element) element.scrollTop = element.scrollHeight
    }
  }, [logs, autoScroll])

  if (!tabId) return <div className="text-center py-8 text-gray-600">No tab selected.</div>

  const actions = {
    copy: () => navigator.clipboard.writeText(logs.join('\n')),
    clear: () => clearLogs(tabId),
    export: () => {
      const blob = new Blob([logs.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${new Date().toISOString()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-4">
      <LogsHeader tabId={tabId} logsCount={logs.length} />
      <LogsControls onCopy={actions.copy} onExport={actions.export} onClear={actions.clear}
        autoScroll={autoScroll} onToggleAutoScroll={() => setAutoScroll(!autoScroll)} />
      <LogsDisplay logs={logs} />
    </div>
  )
}