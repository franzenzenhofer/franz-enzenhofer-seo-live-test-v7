import { ReportHeader } from './ReportHeader'
import { ReportSection } from './ReportSection'
import { useReportData } from './useReportData'

import type { Result } from '@/shared/results'
import { resultSortOrder } from '@/shared/colors'

export const ReportApp = () => {
  const { results, url, loading } = useReportData()

  // Group results by type and add index
  const groupedResults = results.reduce((acc, result, index) => {
    const type = result.type || 'info'
    if (!acc[type]) acc[type] = []
    acc[type].push({ ...result, index })
    return acc
  }, {} as Record<string, (Result & { index: number })[]>)

  // Sort groups by priority (errors first, then warnings, info, ok)
  const sortedGroups = Object.entries(groupedResults).sort(([a], [b]) => {
    const orderA = resultSortOrder[a as keyof typeof resultSortOrder] ?? 999
    const orderB = resultSortOrder[b as keyof typeof resultSortOrder] ?? 999
    return orderA - orderB
  })

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
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <ReportHeader url={url} resultCount={results.length} groupedResults={groupedResults} results={results} />
        <div className="mt-6 space-y-6">
          {sortedGroups.map(([type, items]) => (
            <ReportSection key={type} type={type} items={items} />
          ))}
        </div>
      </div>
    </div>
  )
}
