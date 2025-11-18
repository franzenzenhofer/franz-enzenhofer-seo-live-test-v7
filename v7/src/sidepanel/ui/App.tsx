import { useState } from 'react'

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
  const { items, meta, loading } = useResultsSource()
  const [debugEnabled] = useDebugFlag()
  const logUi = usePanelLogger(items.length)
  usePanelBootstrap(logUi)
  useResultsLogger(logUi, items.length)
  const { runNow, clean, openSettings, openReport, openLogs } = usePanelActions(logUi)

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
        tabId={-1}
        logUi={logUi}
      />
    </>
  )
}
