import { useState } from 'react'

import { ResultSummary as ReportResultSummary } from './ResultSummary'

import { FilterTips } from '@/sidepanel/ui/FilterTips'
import { Results } from '@/sidepanel/ui/Results'
import { ResultsSummary } from '@/sidepanel/ui/ResultsSummary'
import { TypeFilters } from '@/sidepanel/ui/TypeFilters'
import { useFilterParser } from '@/sidepanel/ui/useFilterParser'
import type { ResultSortMode } from '@/sidepanel/ui/resultSort'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'
import { computeResultCoverage } from '@/shared/resultCoverage'
import type { Result } from '@/shared/results'

type Props = { results: Result[]; debugEnabled: boolean }

export const ReportResultsSection = ({ results, debugEnabled }: Props) => {
  const [show, setShow] = useState<Record<string, boolean>>(() => createDefaultTypeVisibility())
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<ResultSortMode>('name')
  const parsed = useFilterParser(query)
  const coverage = computeResultCoverage(results)
  const resetFilters = () => { setShow(() => createDefaultTypeVisibility()); setQuery('') }
  const activeTypes = parsed.hasTypeFilter ? parsed.types : Object.entries(show).filter(([, v]) => v).map(([k]) => k)

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search results..."
        className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
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
      <ReportResultSummary totalRules={coverage.totalRules} resultsCount={coverage.coveredRules} missing={coverage.missingRules} debugEnabled={debugEnabled} />
      <Results
        items={results}
        types={activeTypes}
        q={parsed.text}
        priorityFilter={parsed.priorityFilter}
        priorityLabel={parsed.priorityLabel}
        debugEnabled={debugEnabled}
        onResetFilters={resetFilters}
        tabId={null}
        logUi={undefined}
        sortMode={sortMode}
        defaultExpanded
      />
    </div>
  )
}
