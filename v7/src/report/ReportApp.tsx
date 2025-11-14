import { ReportSection } from './ReportSection'
import { useReportData } from './useReportData'
import { ReportExportButtons } from './ExportButtons'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import type { Result } from '@/shared/results'
import { resultSortOrder } from '@/shared/colors'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'

const groupAndSortResults = (results: Result[]) => {
  const grouped = results.reduce(
    (acc, result, index) => {
      const type = result.type || 'info'
      if (!acc[type]) acc[type] = []
      acc[type].push({ ...result, index })
      return acc
    },
    {} as Record<string, (Result & { index: number })[]>,
  )
  return Object.entries(grouped).sort(([a], [b]) => {
    const orderA = resultSortOrder[a as keyof typeof resultSortOrder] ?? 999
    const orderB = resultSortOrder[b as keyof typeof resultSortOrder] ?? 999
    return orderA - orderB
  })
}

export const ReportApp = () => {
  const { results, runMeta, loading } = useReportData()
  const sortedGroups = groupAndSortResults(results)
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

  if (!results.length) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-semibold mb-2">No Results Found</h1>
          <p className="text-sm text-gray-600">Run a test from the extension to see results here.</p>
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
          secondaryActions={
            <>
              <span className="text-gray-600">{results.length} results</span>
              <ReportExportButtons url={runMeta?.url || ''} results={results} />
            </>
          }
        />
        <div className="p-4 sm:p-6 space-y-6">
          {sortedGroups.map(([type, items]) => (
            <ReportSection key={type} type={type} items={items} />
          ))}
        </div>
      </div>
    </div>
  )
}
