import React from 'react'

interface Props {
  searchUrl: string
  filterTabId: string
  onSearchUrlChange: (value: string) => void
  onFilterTabIdChange: (value: string) => void
  totalRuns: number
  filteredCount: number
}

export const RunHistoryFilters = ({
  searchUrl,
  filterTabId,
  onSearchUrlChange,
  onFilterTabIdChange,
  totalRuns,
  filteredCount,
}: Props): React.JSX.Element => {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Rule Run History</h1>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="search-url" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by URL
          </label>
          <input
            id="search-url"
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Search URLs..."
            value={searchUrl}
            onChange={(e) => onSearchUrlChange(e.target.value)}
          />
        </div>
        <div className="w-32">
          <label htmlFor="filter-tab" className="block text-sm font-medium text-gray-700 mb-1">
            Tab ID
          </label>
          <input
            id="filter-tab"
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Tab ID"
            value={filterTabId}
            onChange={(e) => onFilterTabIdChange(e.target.value)}
          />
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredCount} of {totalRuns} runs
      </div>
    </div>
  )
}
