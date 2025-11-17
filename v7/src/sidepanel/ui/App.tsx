import { useState } from 'react'

import { Shortcuts } from './Shortcuts'
import { AppBody } from './AppBody'
import { useResultsSource } from './useResultsSource'
import { useRunMeta } from './useRunMeta'
import { usePanelLogger } from './usePanelLogger'
import { usePanelBootstrap } from './usePanelBootstrap'
import { usePanelActions } from './usePanelActions'
import { useResultsLogger } from './useResultsLogger'

export const App = () => {
  const [show, setShow] = useState<Record<string, boolean>>({ ok: true, warn: true, error: true, runtime_error: true, info: true, pending: true, disabled: true })
  const [query, setQuery] = useState('')
  const resultsSource = useResultsSource()
  const runMeta = useRunMeta(resultsSource.tabId)
  const logUi = usePanelLogger(resultsSource.tabId)
  usePanelBootstrap(logUi)
  useResultsLogger(logUi, resultsSource.items.length)
  const { runNow, clean, openSettings, openReport, openLogs } = usePanelActions(logUi)
  if (!runMeta && !resultsSource.items.length) return <p className="p-3">Loading…</p>

  return (
    <>
      <Shortcuts runNow={runNow} clean={clean} openLogs={openLogs} openSettings={openSettings} />
      <AppBody
        d={{ url: runMeta?.url || '', ranAt: runMeta?.ranAt, runId: runMeta?.runId, status: runMeta?.status }}
        show={show}
        setShow={setShow}
        query={query}
        setQuery={setQuery}
        openSettings={openSettings}
        onClean={clean}
        onOpenLogs={openLogs}
        onOpenReport={openReport}
        results={resultsSource.items}
        tabId={resultsSource.tabId}
        logUi={logUi}
      />
    </>
  )
}
