import { useState } from 'react'

import { Shortcuts } from './Shortcuts'
import { usePageInfo } from './usePageInfo'
import { AppBody } from './AppBody'
import { useResultsSource } from './useResultsSource'
import { useRunMeta } from './useRunMeta'
import { usePanelLogger } from './usePanelLogger'
import { usePanelBootstrap } from './usePanelBootstrap'
import { usePanelActions } from './usePanelActions'
import { useResultsLogger } from './useResultsLogger'
import { RestrictedInfo } from './RestrictedInfo'

export const App = () => {
  const [show, setShow] = useState<Record<string, boolean>>({ ok: true, warn: true, error: true, runtime_error: true, info: true, pending: true, disabled: true })
  const [query, setQuery] = useState('')
  const q = usePageInfo()
  const resultsSource = useResultsSource()
  const runMeta = useRunMeta(resultsSource.tabId)
  const logUi = usePanelLogger(resultsSource.tabId)
  usePanelBootstrap(logUi)
  useResultsLogger(logUi, resultsSource.items.length)
  const { runNow, clean, openSettings, openReport, openLogs } = usePanelActions(logUi)
  const showRestricted = Boolean(q.isError)
  const displayUrl = q.data?.url || runMeta?.url || ''
  if (q.isLoading && !runMeta && !resultsSource.items.length) return <p className="p-3">Loading…</p>

  return (
    <>
      {showRestricted && <RestrictedInfo error={q.error} runMeta={runMeta} />}
      <Shortcuts runNow={runNow} clean={clean} openLogs={openLogs} openSettings={openSettings} />
      <AppBody
        d={{ url: displayUrl, stale: showRestricted, ranAt: runMeta?.ranAt, runId: runMeta?.runId }}
        show={show}
        setShow={setShow}
        query={query}
        setQuery={setQuery}
        openSettings={openSettings}
        onClean={clean}
        onOpenLogs={openLogs}
        onOpenReport={openReport}
        results={resultsSource.items}
      />
    </>
  )
}
