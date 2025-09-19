import type { Dispatch, SetStateAction } from 'react'

import { Logs } from './Logs'
import { UrlBar } from './UrlBar'
import { Results } from './Results'
import { Search } from './Search'
import { TypeFilters } from './TypeFilters'
import { Header } from './Header'
import type { Tab } from './TabStrip'

export const AppBody = ({
  tab, setTab,
  showLogs, setShowLogs,
  d, show, setShow,
  query, setQuery,
}: {
  tab: Tab; setTab: (t: Tab)=>void
  showLogs: boolean; setShowLogs: (b: boolean)=>void
  d: { url: string }
  show: Record<string, boolean>; setShow: Dispatch<SetStateAction<Record<string, boolean>>>
  query: string; setQuery: (q: string)=>void
}) => {
  // Open settings in new tab when selected
  if (tab === 'settings') {
    const url = chrome.runtime.getURL('settings.html')
    chrome.tabs.create({ url })
    setTab('results') // Reset to results
  }

  return (
    <div className="dt-panel w-[360px]">
      <Header tab={tab} showLogs={showLogs} setTab={setTab} setShowLogs={setShowLogs} />
      <div className="p-3 space-y-3">
        {showLogs && <Logs />}
        <UrlBar url={d.url} />
        <Search onChange={setQuery} />
        <TypeFilters show={show} setShow={setShow} />
        <Results types={Object.entries(show).filter(([,v])=>v).map(([k])=>k)} q={query} />
      </div>
    </div>
  )
}
