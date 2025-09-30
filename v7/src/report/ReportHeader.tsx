import { getResultColor } from '@/shared/colors'
import type { Result } from '@/shared/results'

export const ReportHeader = ({
  url,
  resultCount,
  groupedResults
}: {
  url: string
  resultCount: number
  groupedResults: Record<string, (Result & { index: number })[]>
}) => {
  const version = chrome.runtime.getManifest().version

  return (
    <div className="border-b pb-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        Live Test Report
        <span className="text-sm text-gray-500">v{version}</span>
      </h1>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
        <span className="text-sm text-gray-600 flex-1">{url}</span>
        <div className="flex items-center gap-2">
          {Object.entries(groupedResults).map(([type, items]) => {
            const color = getResultColor(type)
            return (
              <span key={type} className={`px-2 py-1 text-xs rounded ${color.badge}`}>
                {type}: {items.length}
              </span>
            )
          })}
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            Total: {resultCount}
          </span>
        </div>
      </div>
    </div>
  )
}