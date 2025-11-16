import type { Dispatch, SetStateAction } from 'react'

import { Results } from './Results'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { useFilterParser } from './useFilterParser'
import { PanelHeader } from './PanelHeader'

import type { Result } from '@/shared/results'

export const AppBody = ({
  d,
  show,
  setShow,
  query,
  setQuery,
  openSettings,
  onClean,
  onOpenLogs,
  results,
  onOpenReport,
  tabId,
  logUi,
}: {
  d: { url: string; stale?: boolean; ranAt?: string; runId?: string }
  show: Record<string, boolean>
  setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string
  setQuery: (q: string) => void
  openSettings: () => void
  onClean: () => void
  onOpenLogs: () => void
  results: Result[]
  onOpenReport: () => void
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}) => {
  const parsed = useFilterParser(query)

  return (
    <div className="dt-panel w-[360px]">
      <PanelHeader
        url={d.url}
        runId={d.runId}
        ranAt={d.ranAt}
        onOpenReport={onOpenReport}
        onClean={onClean}
        onOpenLogs={onOpenLogs}
        onOpenSettings={openSettings}
      />
      <div className="p-3 space-y-3">
        <Search onChange={setQuery} />
        <TypeFilters show={show} setShow={setShow} results={results} />
        <Results
          items={results}
          types={parsed.hasTypeFilter ? parsed.types : Object.entries(show).filter(([, v]) => v).map(([k]) => k)}
          q={parsed.text}
          tabId={tabId}
          logUi={logUi}
        />
      </div>
    </div>
  )
}
