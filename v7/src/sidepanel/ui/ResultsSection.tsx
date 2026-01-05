import type { Dispatch, SetStateAction } from 'react'

import { Results } from './Results'
import { ResultsSummary } from './ResultsSummary'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { useFilterParser } from './useFilterParser'
import { FilterTips } from './FilterTips'
import type { ResultSortMode } from './resultSort'

import type { Result } from '@/shared/results'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'

type Props = {
  show: Record<string, boolean>
  setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string
  setQuery: (q: string) => void
  results: Result[]
  debugEnabled: boolean
  sortMode: ResultSortMode
  setSortMode: (mode: ResultSortMode) => void
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}

export const ResultsSection = ({ show, setShow, query, setQuery, results, debugEnabled, sortMode, setSortMode, tabId, logUi }: Props) => {
  const parsed = useFilterParser(query)
  const activeTypes = parsed.hasTypeFilter ? parsed.types : Object.entries(show).filter(([, v]) => v).map(([k]) => k)
  const resetFilters = () => { setShow(() => createDefaultTypeVisibility()); setQuery('') }
  return (
    <div className="p-3 space-y-3">
      <Search onChange={setQuery} />
      <FilterTips />
      <TypeFilters show={show} setShow={setShow} results={results} debugEnabled={debugEnabled} />
      <ResultsSummary
        items={results}
        types={activeTypes}
        q={parsed.text}
        priorityFilter={parsed.priorityFilter}
        priorityLabel={parsed.priorityLabel}
        typeSource={parsed.hasTypeFilter ? 'search' : 'toggle'}
        onResetFilters={resetFilters}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />
      <Results
        items={results}
        types={activeTypes}
        q={parsed.text}
        priorityFilter={parsed.priorityFilter}
        debugEnabled={debugEnabled}
        onResetFilters={resetFilters}
        sortMode={sortMode}
        tabId={tabId}
        logUi={logUi}
        defaultExpanded={false}
      />
    </div>
  )
}
