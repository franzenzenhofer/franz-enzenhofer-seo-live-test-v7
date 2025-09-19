import { Toolbar } from './Toolbar'
import { TabStrip, type Tab } from './TabStrip'

export const Header = ({ tab, showLogs, setTab, setShowLogs }: {
  tab: Tab; showLogs: boolean; setTab: (t: Tab)=>void; setShowLogs: (v: boolean)=>void
}) => (
  <div className="dt-panel-header">
    <div className="flex items-center justify-between mb-2">
      <h1 className="font-semibold">Live Test</h1>
      <Toolbar settings={tab==='settings'} toggleSettings={()=> setTab(tab==='settings' ? 'results' : 'settings')} showLogs={showLogs} toggleLogs={()=> setShowLogs(!showLogs)} />
    </div>
    <TabStrip tab={(showLogs ? 'logs' : tab)} setTab={(t)=> { setShowLogs(t==='logs'); setTab(t) }} />
  </div>
)
