import { RunNow } from './RunNow'

import { getActiveTabId } from '@/shared/chrome'
import { clearLogs } from '@/shared/logs'
import { clearResults } from '@/shared/results'

export const Toolbar = ({ settings, toggleSettings, showLogs, toggleLogs }: {
  settings: boolean
  toggleSettings: () => void
  showLogs: boolean
  toggleLogs: () => void
}) => (
  <div className="flex items-center gap-2">
    {!settings && <RunNow />}
    {!settings && <button className="text-sm underline" onClick={toggleLogs}>{showLogs? 'Hide logs' : 'Show logs'}</button>}
    {!settings && (
      <button
        className="text-sm underline"
        onClick={async ()=>{ const id = await getActiveTabId(); if(id){ await clearResults(id); await clearLogs(id) } }}
      >
        Clean
      </button>
    )}
    <button className="text-sm underline" onClick={toggleSettings}>{settings? 'Results' : 'Settings'}</button>
  </div>
)

