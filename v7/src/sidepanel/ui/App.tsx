import { useEffect, useState } from 'react'

import { Logs } from './Logs'
import { Settings } from './Settings'
import { UrlBar } from './UrlBar'
import { Results } from './Results'
import { ReportContainer } from './ReportContainer'
import { RestrictedBanner } from './RestrictedBanner'
import { Search } from './Search'
import { Shortcuts } from './Shortcuts'
import { TypeFilters } from './TypeFilters'
import { usePageInfo } from './usePageInfo'
import { Header } from './Header'
import type { Tab } from './TabStrip'

import { clearLogs } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { getActiveTabId, injectForTab } from '@/shared/chrome'


export const App = () => {
  const [tab, setTab] = useState<Tab>('results')
  const [showLogs, setShowLogs] = useState(false)
  const [report, setReport] = useState<{ open: boolean; index?: number }>({ open: false })
  const [show, setShow] = useState<Record<string, boolean>>({ ok: true, warn: true, error: true, info: true })
  const [query, setQuery] = useState('')
  const q = usePageInfo()
  useEffect(() => { getActiveTabId().then((id)=> { if (id) injectForTab(id) }).catch(()=>{}) }, [])
  if (q.isLoading) return <p className="p-3">Loading…</p>
  if (q.isError) return <div className="p-3 space-y-2"><RestrictedBanner message={String(q.error)} /></div>
  const d = q.data!
  return (
    <div className="p-3 space-y-3 w-[360px]">
      <Header tab={tab} reportOpen={report.open} showLogs={showLogs} setTab={setTab} setShowLogs={setShowLogs} setReportOpen={(v)=> setReport((r)=> ({ ...r, open: v }))} />
      <Shortcuts runNow={()=> chrome.runtime.sendMessage({ type:'panel:runNow' })} clean={async()=> { const id = await getActiveTabId(); if(id){ await clearResults(id); await clearLogs(id) } }} setTab={(t)=> setTab(t)} />
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
}
