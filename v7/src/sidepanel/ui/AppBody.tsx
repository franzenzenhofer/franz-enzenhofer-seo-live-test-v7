import type { Dispatch, SetStateAction } from 'react'

import { UrlBar } from './UrlBar'
import { Results } from './Results'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { Header } from './Header'

import type { Result } from '@/shared/results'

export const AppBody = ({
  d, show, setShow,
  query, setQuery,
  onOpenLogs,
  openSettings,
  onClean,
  results,
  onOpenReport,
}: {
  d: { url: string; stale?: boolean; ranAt?: string; runId?: string }
  show: Record<string, boolean>; setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string; setQuery: (q: string)=>void
  onOpenLogs: () => void
  openSettings: () => void
  onClean: () => void
  results: Result[]
  onOpenReport: () => void
}) => {
  return (
    <div className="dt-panel w-[360px]">
      <Header onOpenLogs={onOpenLogs} onClean={onClean} onOpenSettings={openSettings} />
      <div className="p-3 space-y-3">
        <UrlBar url={d.url} stale={d.stale} ranAt={d.ranAt} runId={d.runId} onOpenReport={onOpenReport} />
        <Search onChange={setQuery} />
        <TypeFilters show={show} setShow={setShow} />
        <Results items={results} types={Object.entries(show).filter(([,v])=>v).map(([k])=>k)} q={query} />
      </div>
    </div>
  )
}
