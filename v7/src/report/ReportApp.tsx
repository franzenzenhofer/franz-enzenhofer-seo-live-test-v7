import { ReportHeader } from './ReportHeader'
import { ReportSection } from './ReportSection'
import { useReportData } from './useReportData'

import type { Result } from '@/shared/results'

export const ReportApp = () => {
  const { results, url, loading } = useReportData()

  const groupedResults = results.reduce((acc, result, index) => {
    const type = result.type || 'info'
    if (!acc[type]) acc[type] = []
    acc[type].push({ ...result, index })
    return acc
  }, {} as Record<string, (Result & { index: number })[]>)

  if (loading) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>Loading Report...</h1>
        </div>
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>No Results Found</h1>
          <p>Run a test from the extension to see results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="report-container">
      <ReportHeader url={url} resultCount={results.length} />
      <div className="report-content">
        {Object.entries(groupedResults).map(([type, items]) => (
          <ReportSection key={type} type={type} items={items} />
        ))}
      </div>
    </div>
  )
}