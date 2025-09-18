import { Toolbar } from './Toolbar'
import { TabStrip, type Tab } from './TabStrip'

export const Header = ({ tab, reportOpen, showLogs, setTab, setShowLogs, setReportOpen }: {
  tab: Tab; reportOpen: boolean; showLogs: boolean; setTab: (t: Tab)=>void; setShowLogs: (v: boolean)=>void; setReportOpen: (v: boolean)=>void
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold">Live Test</h1>
      <Toolbar settings={tab==='settings'} toggleSettings={()=> setTab(tab==='settings' ? 'results' : 'settings')} showLogs={showLogs} toggleLogs={()=> setShowLogs(!showLogs)} />
    </div>
    <TabStrip tab={reportOpen ? 'report' : (showLogs ? 'logs' : tab)} setTab={(t)=> { if (t==='report') setReportOpen(true); else { setReportOpen(false); setShowLogs(t==='logs'); setTab(t) } }} />
  </div>
)

