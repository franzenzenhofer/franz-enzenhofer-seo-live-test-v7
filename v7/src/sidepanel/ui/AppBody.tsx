import type { Dispatch, SetStateAction } from 'react'
import { useState, useEffect } from 'react'

import { Results } from './Results'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { RunNow } from './RunNow'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import type { Result } from '@/shared/results'
import { openUrlInCurrentTab } from '@/shared/openUrlInCurrentTab'

export const AppBody = ({
  d,
  show,
  setShow,
  query,
  setQuery,
  openSettings,
  onClean,
  onOpenLogs,
  results,
  onOpenReport,
}: {
  d: { url: string; stale?: boolean; ranAt?: string; runId?: string }
  show: Record<string, boolean>
  setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string
  setQuery: (q: string) => void
  openSettings: () => void
  onClean: () => void
  onOpenLogs: () => void
  results: Result[]
  onOpenReport: () => void
}) => {
  const version = chrome.runtime.getManifest().version
  const [editableUrl, setEditableUrl] = useState(d.url || '')

  // Sync editableUrl with displayUrl when it changes
  useEffect(() => {
    setEditableUrl(d.url || '')
  }, [d.url])

  return (
    <div className="dt-panel w-[360px]">
      <LiveTestHeader
        url={d.url}
        editableUrl={editableUrl}
        onUrlChange={setEditableUrl}
        runId={d.runId}
        ranAt={d.ranAt}
        version={version}
        primaryAction={<RunNow url={editableUrl} />}
        onOpenUrl={openUrlInCurrentTab}
        onOpenReport={onOpenReport}
        secondaryActions={
          <>
            <button className="text-blue-600 hover:text-blue-800 underline font-semibold" onClick={onOpenReport}>
              Open Full Report
            </button>
            <button className="text-gray-600 hover:text-gray-900 underline" onClick={onClean}>
              Clean
            </button>
            <button className="text-gray-600 hover:text-gray-900 underline" onClick={onOpenLogs}>
              Logs
            </button>
            <button className="text-gray-600 hover:text-gray-900 underline" onClick={openSettings}>
              Settings
            </button>
          </>
        }
      />
      <div className="p-3 space-y-3">
        <Search onChange={setQuery} />
        <TypeFilters show={show} setShow={setShow} results={results} />
        <Results items={results} types={Object.entries(show).filter(([, v]) => v).map(([k]) => k)} q={query} />
      </div>
    </div>
  )
}
