import type { Dispatch, SetStateAction } from 'react'

import { Results } from './Results'
import { ResultsSummary } from './ResultsSummary'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { useFilterParser } from './useFilterParser'
import { PanelHeader } from './PanelHeader'

import type { Result } from '@/shared/results'
import type { RunMeta } from '@/shared/runMeta'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'
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
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}) => {
  const parsed = useFilterParser(query)
  const activeTypes = parsed.hasTypeFilter ? parsed.types : Object.entries(show).filter(([, v]) => v).map(([k]) => k)
  const resetFilters = () => { setShow(() => createDefaultTypeVisibility()); setQuery('') }
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
      <div className="p-3 space-y-3">
        <Search onChange={setQuery} />
        <TypeFilters show={show} setShow={setShow} results={results} debugEnabled={debugEnabled} />
        <ResultsSummary items={results} types={activeTypes} q={parsed.text} typeSource={parsed.hasTypeFilter ? 'search' : 'toggle'} onResetFilters={resetFilters} />
        <Results
          items={results}
          types={activeTypes}
          q={parsed.text}
          debugEnabled={debugEnabled}
          onResetFilters={resetFilters}
          tabId={tabId}
          logUi={logUi}
          defaultExpanded={false}
        />
      </div>
    </div>
  )
}
