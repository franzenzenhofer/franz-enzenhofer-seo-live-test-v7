import { ReportExportButtons } from './ExportButtons'
import { ResultBadges } from './ResultBadges'

import type { Result } from '@/shared/results'

export const ReportHeader = ({
  url,
  resultCount,
  groupedResults,
  results,
}: {
  url: string
  resultCount: number
  groupedResults: Record<string, (Result & { index: number })[]>
  results: Result[]
}) => {
  const version = chrome.runtime.getManifest().version
  const counts = Object.fromEntries(
    Object.entries(groupedResults).map(([type, items]) => [type, items.length]),
  ) as Record<string, number>

  return (
    <div className="border-b pb-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        Live Test Report
        <span className="text-sm text-gray-500">v{version}</span>
      </h1>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
        <span className="text-sm text-gray-600 flex-1">{url}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <ResultBadges counts={counts} />
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            Total: {resultCount}
          </span>
          <ReportExportButtons url={url} results={results} />
        </div>
      </div>
    </div>
  )
}
