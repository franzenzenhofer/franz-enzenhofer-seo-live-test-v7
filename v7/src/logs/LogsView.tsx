import { useState } from 'react'

import { LogsControls } from './LogsControls'
import { LogsDisplay } from './LogsDisplay'
import { LogsHeader } from './LogsHeader'
import { LogsSummary } from './LogsSummary'
import { useAggregatedLogs } from './useAggregatedLogs'
import { useAutoScroll } from './useAutoScroll'

import { clearLogs } from '@/shared/logs'

export const LogsView = ({ tabId }: { tabId: number | null }) => {
  const allLogs = useAggregatedLogs()
  const [autoScroll, setAutoScroll] = useState(true)

  // Show all logs without filtering by tabId
  const visibleLogs = allLogs

  useAutoScroll(autoScroll, visibleLogs)

  const copy = () => navigator.clipboard.writeText(visibleLogs.join('\n'))
  const exportLogs = () => {
    const blob = new Blob([visibleLogs.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  const clear = () => { if (typeof tabId === 'number') void clearLogs(tabId) }

  return (
    <div className="space-y-4">
      <LogsHeader tabId={tabId} logsCount={visibleLogs.length} />
      <LogsSummary logs={visibleLogs} />
      <LogsControls
        onCopy={copy}
        onExport={exportLogs}
        onClear={clear}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
        disableClear={typeof tabId !== 'number'}
      />
      <LogsDisplay logs={visibleLogs} />
    </div>
  )
}
