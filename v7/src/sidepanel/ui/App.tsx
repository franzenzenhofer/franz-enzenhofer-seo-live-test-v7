import { useEffect, useState } from 'react'

import { RestrictedBanner } from './RestrictedBanner'
import { Shortcuts } from './Shortcuts'
import { usePageInfo } from './usePageInfo'
import { AppBody } from './AppBody'
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
  useEffect(() => {
    getActiveTabId()
      .then(async (id) => { if (id) { try { await injectForTab(id) } catch { /* ignore */ } } })
      .catch(() => {})
  }, [])
  if (q.isLoading) return <p className="p-3">Loading…</p>
  if (q.isError || !q.data) return <div className="p-3 space-y-2"><RestrictedBanner message={String(q.error||'No page info')} /></div>
  const d = q.data!
  return <>
    <Shortcuts runNow={()=> chrome.runtime.sendMessage({ type:'panel:runNow' })} clean={async()=> { const id = await getActiveTabId(); if(id){ await clearResults(id); await clearLogs(id) } }} setTab={(t: Tab)=> setTab(t)} />
    <AppBody tab={tab} setTab={setTab} report={report} setReport={setReport} showLogs={showLogs} setShowLogs={setShowLogs} d={{ url: d.url }} show={show} setShow={setShow} query={query} setQuery={setQuery} />
  </>
}
