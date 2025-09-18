import { useEffect, useState } from 'react'

import { Logs } from './Logs'
import { Settings } from './Settings'
import { Toolbar } from './Toolbar'
import { InfoRow } from './InfoRow'
import { Results } from './Results'
import { ReportContainer } from './ReportContainer'
import { TypeFilters } from './TypeFilters'
import { usePageInfo } from './usePageInfo'

import { getActiveTabId, injectForTab } from '@/shared/chrome'

export const App = () => {
  const [settings, setSettings] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [report, setReport] = useState<{ open: boolean; index?: number }>({ open: false })
  const [show, setShow] = useState<Record<string, boolean>>({ ok: true, warn: true, error: true, info: true })
  const q = usePageInfo()
  useEffect(() => { getActiveTabId().then((id)=> { if (id) injectForTab(id) }).catch(()=>{}) }, [])
  if (q.isLoading) return <p className="p-3">Loading…</p>
  if (q.isError) return <p className="p-3">{String(q.error)}</p>
  const d = q.data!
  return (
    <div className="p-3 space-y-3 w-[360px]">
      <div className="dt-toolbar flex items-center justify-between">
        <h1 className="text-lg font-semibold">Live Test</h1>
        <Toolbar settings={settings} toggleSettings={()=> setSettings(s=>!s)} showLogs={showLogs} toggleLogs={()=> setShowLogs(s=>!s)} />
      </div>
      {settings ? (
        <Settings />
      ) : report.open ? (
        <ReportContainer url={d.url} index={report.index} onClose={()=> setReport({ open: false })} />
      ) : (
        <>
          {showLogs && <Logs />}
          <div className="space-y-2">
            <InfoRow k="URL" v={d.url} />
            <InfoRow k="Title" v={d.title} />
            <InfoRow k="Description" v={d.description || '—'} />
            <InfoRow k="Canonical" v={d.canonical || '—'} />
          </div>
          <TypeFilters show={show} setShow={setShow} />
          <Results types={Object.entries(show).filter(([,v])=>v).map(([k])=>k)} onOpen={(i)=> setReport({ open: true, index: i })} />
        </>
      )}
    </div>
  )
}
