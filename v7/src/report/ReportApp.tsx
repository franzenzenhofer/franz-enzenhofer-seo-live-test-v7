import { useState } from 'react'

import { useReportData } from './useReportData'
import { ReportExportButtons } from './ExportButtons'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'
import { TypeFilters } from '@/sidepanel/ui/TypeFilters'
import { Results } from '@/sidepanel/ui/Results'
import { useFilterParser } from '@/sidepanel/ui/useFilterParser'

export const ReportApp = () => {
  const { results, runMeta, loading, error } = useReportData()
  const [show, setShow] = useState<Record<string, boolean>>({ ok: true, warn: true, error: true, runtime_error: true, info: true, pending: true, disabled: true })
  const [query, setQuery] = useState('')
  const parsed = useFilterParser(query)
  const version = chrome.runtime.getManifest().version

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-semibold">Loading Report...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-semibold mb-2 text-red-600">Error</h1>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

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
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search results..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <TypeFilters show={show} setShow={setShow} results={results} />
          <Results
            items={results}
            types={parsed.hasTypeFilter ? parsed.types : Object.entries(show).filter(([, v]) => v).map(([k]) => k)}
            q={parsed.text}
            tabId={null}
            logUi={undefined}
          />
        </div>
      </div>
    </div>
  )
}
