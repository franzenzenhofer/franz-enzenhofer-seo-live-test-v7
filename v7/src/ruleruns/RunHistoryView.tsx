import React, { useState } from 'react'

import { RunHistoryFilters } from './RunHistoryFilters'
import { RunRow } from './RunRow'

import type { RunState } from '@/background/rules/runState'

interface Props {
  history: RunState[]
  loading: boolean
}

export const RunHistoryView = ({ history, loading }: Props): React.JSX.Element => {
  const [filterTabId, setFilterTabId] = useState<string>('')
  const [searchUrl, setSearchUrl] = useState<string>('')

  const filtered = history.filter((run) => {
    if (filterTabId && !run.tabId.toString().includes(filterTabId)) return false
    if (searchUrl && !run.url.toLowerCase().includes(searchUrl.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].reverse() // Show most recent first

  return (
    <div className="space-y-4">
      <RunHistoryFilters
        searchUrl={searchUrl}
        filterTabId={filterTabId}
        onSearchUrlChange={setSearchUrl}
        onFilterTabIdChange={setFilterTabId}
        totalRuns={history.length}
        filteredCount={sorted.length}
      />

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {history.length === 0 ? 'No test runs recorded yet' : 'No runs match your filters'}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Run ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Tab ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">URL</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Triggered By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Started At</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((run) => (
                  <RunRow key={run.runId} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
