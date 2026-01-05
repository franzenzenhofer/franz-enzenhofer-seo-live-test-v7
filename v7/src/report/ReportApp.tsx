import { useState } from 'react'

import { useReportData } from './useReportData'
import { ReportExportButtons } from './ExportButtons'
import { ResultSummary } from './ResultSummary'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'
import { TypeFilters } from '@/sidepanel/ui/TypeFilters'
import { Results } from '@/sidepanel/ui/Results'
import { useFilterParser } from '@/sidepanel/ui/useFilterParser'
import { computeResultCoverage } from '@/shared/resultCoverage'
import { useDebugFlag } from '@/shared/hooks/useDebugFlag'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'

export const ReportApp = () => {
  const { results, runMeta, loading, error } = useReportData()
  const [show, setShow] = useState<Record<string, boolean>>(() => createDefaultTypeVisibility())
  const [query, setQuery] = useState('')
  const parsed = useFilterParser(query)
  const version = chrome.runtime.getManifest().version
  const [debugEnabled] = useDebugFlag()

  if (loading || error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className={`text-2xl font-semibold${error ? ' mb-2 text-red-600' : ''}`}>
            {error ? 'Error' : 'Loading Report...'}
          </h1>
          {error && <p className="text-sm text-gray-600">{error}</p>}
        </div>
      </div>
    )
  }

  const coverage = computeResultCoverage(results)
  const resetFilters = () => { setShow(() => createDefaultTypeVisibility()); setQuery('') }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        <LiveTestHeader
          url={runMeta?.url || ''}
          runId={runMeta?.runId}
          ranAt={runMeta?.ranAt}
          version={version}
          onOpenUrl={openUrlInCurrentTab}
          secondaryActions={<ReportExportButtons url={runMeta?.url || ''} results={results} />}
        />
        <div className="p-4 sm:p-6 space-y-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search results..."
            className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <TypeFilters show={show} setShow={setShow} results={results} debugEnabled={debugEnabled} />
          <ResultSummary totalRules={coverage.totalRules} resultsCount={coverage.coveredRules} missing={coverage.missingRules} debugEnabled={debugEnabled} />
          <Results
            items={results}
            types={parsed.hasTypeFilter ? parsed.types : Object.entries(show).filter(([, v]) => v).map(([k]) => k)}
            q={parsed.text}
            priorityFilter={parsed.priorityFilter}
            debugEnabled={debugEnabled}
            onResetFilters={resetFilters}
            tabId={null}
            logUi={undefined}
            defaultExpanded
          />
        </div>
      </div>
    </div>
  )
}
