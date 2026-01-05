import type { Dispatch, SetStateAction } from 'react'

import { PanelHeader } from './PanelHeader'
import { ResultsSection } from './ResultsSection'
import type { ResultSortMode } from './resultSort'

import type { Result } from '@/shared/results'
import type { RunMeta } from '@/shared/runMeta'
export const AppBody = ({
  meta,
  runId,
  show,
  setShow,
  query,
  setQuery,
  debugEnabled,
  openSettings,
  onClean,
  onOpenLogs,
  results,
  onOpenReport,
  sortMode,
  setSortMode,
  tabId,
  logUi,
}: {
  meta: RunMeta | null
  runId?: string | null
  show: Record<string, boolean>
  setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string
  setQuery: (q: string) => void
  debugEnabled: boolean
  openSettings: () => void
  onClean: () => void
  onOpenLogs: () => void
  results: Result[]
  onOpenReport: () => void
  sortMode: ResultSortMode
  setSortMode: (mode: ResultSortMode) => void
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}) => {
  return (
    <div className="dt-panel w-[360px]">
      <PanelHeader
        url={meta?.url || ''}
        runId={runId || meta?.runId}
        ranAt={meta?.ranAt}
        status={meta?.status}
        onOpenReport={onOpenReport}
        onClean={onClean}
        onOpenLogs={onOpenLogs}
        onOpenSettings={openSettings}
        debugEnabled={debugEnabled}
      />
      <ResultsSection
        show={show}
        setShow={setShow}
        query={query}
        setQuery={setQuery}
        results={results}
        debugEnabled={debugEnabled}
        sortMode={sortMode}
        setSortMode={setSortMode}
        tabId={tabId}
        logUi={logUi}
      />
    </div>
  )
}
