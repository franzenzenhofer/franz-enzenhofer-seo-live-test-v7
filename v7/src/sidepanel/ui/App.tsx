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
  const resultsSource = useResultsSource()
  const [debugEnabled] = useDebugFlag()
  const runMeta = resultsSource.meta
  const logUi = usePanelLogger(resultsSource.tabId)
  usePanelBootstrap(logUi)
  useResultsLogger(logUi, resultsSource.items.length)
  const { runNow, clean, openSettings, openReport, openLogs } = usePanelActions(logUi)
  if (!runMeta && !resultsSource.items.length) return <p className="p-3">Loading…</p>

  return (
    <>
      <Shortcuts runNow={runNow} clean={clean} openLogs={openLogs} openSettings={openSettings} />
      <AppBody
        meta={runMeta}
        show={show}
        setShow={setShow}
        query={query}
        setQuery={setQuery}
        debugEnabled={debugEnabled}
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
