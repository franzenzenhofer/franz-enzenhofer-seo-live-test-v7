import type { Dispatch, SetStateAction } from 'react'

import { Logs } from './Logs'
import { Settings } from './Settings'
import { UrlBar } from './UrlBar'
import { Results } from './Results'
import { ReportContainer } from './ReportContainer'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { Header } from './Header'
import type { Tab } from './TabStrip'

export const AppBody = ({
  tab, setTab,
  report, setReport,
  showLogs, setShowLogs,
  d, show, setShow,
  query, setQuery,
}: {
  tab: Tab; setTab: (t: Tab)=>void
  report: { open: boolean; index?: number }; setReport: (r: { open: boolean; index?: number })=>void
  showLogs: boolean; setShowLogs: (b: boolean)=>void
  d: { url: string }
  show: Record<string, boolean>; setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string; setQuery: (q: string)=>void
}) => (
  <div className="dt-panel w-[360px]">
    <Header tab={tab} showLogs={showLogs} setTab={setTab} setShowLogs={setShowLogs} />
    {tab==='settings' ? (
      <Settings />
    ) : report.open ? (
      <ReportContainer url={d.url} index={report.index} onClose={()=> setReport({ open: false })} />
    ) : (
      <>
        {showLogs && <Logs />}
        <UrlBar url={d.url} />
        <Search onChange={setQuery} />
        <TypeFilters show={show} setShow={setShow} />
        <Results types={Object.entries(show).filter(([,v])=>v).map(([k])=>k)} q={query} onOpen={(i)=> setReport({ open: true, index: i })} />
      </>
    )}
  </div>
)
