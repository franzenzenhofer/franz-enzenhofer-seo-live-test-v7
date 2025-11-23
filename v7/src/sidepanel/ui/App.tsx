import { useMemo, useState } from 'react'

import { Shortcuts } from './Shortcuts'
import { AppBody } from './AppBody'
import { useResultsSource } from './useResultsSource'
import { usePanelLogger } from './usePanelLogger'
import { usePanelBootstrap } from './usePanelBootstrap'
import { usePanelActions } from './usePanelActions'
import { useResultsLogger } from './useResultsLogger'

import { useDebugFlag } from '@/shared/hooks/useDebugFlag'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'

export const App = () => {
  const [show, setShow] = useState<Record<string, boolean>>(() => createDefaultTypeVisibility())
  const [query, setQuery] = useState('')
  const { items, meta, loading, tabId, rawCount, activeRunId } = useResultsSource()
  const [debugEnabled] = useDebugFlag()
  const logUi = usePanelLogger(tabId)
  usePanelBootstrap(logUi)
  const resultsLogData = useMemo(() => ({ filtered: items.length, raw: rawCount, runId: activeRunId || 'none' }), [items.length, rawCount, activeRunId])
  useResultsLogger(logUi, resultsLogData)
  const { runNow, clean, openSettings, openReport, openLogs } = usePanelActions(logUi, activeRunId)

  if (loading) {
    return <p className="p-3">Loading…</p>
  }
  if (!meta && !items.length) {
    return (
      <>
        <Shortcuts runNow={runNow} clean={clean} openLogs={openLogs} openSettings={openSettings} logsEnabled={debugEnabled} />
        <p className="p-3">No results yet. Click "Run" to start.</p>
      </>
    )
  }
  return (
    <>
      <Shortcuts runNow={runNow} clean={clean} openLogs={openLogs} openSettings={openSettings} logsEnabled={debugEnabled} />
      <AppBody
        meta={meta}
        runId={activeRunId}
        show={show}
        setShow={setShow}
        query={query}
        setQuery={setQuery}
        debugEnabled={debugEnabled}
        openSettings={openSettings}
        onClean={clean}
        onOpenLogs={openLogs}
        onOpenReport={openReport}
        results={items}
        tabId={tabId}
        logUi={logUi}
      />
    </>
  )
}
