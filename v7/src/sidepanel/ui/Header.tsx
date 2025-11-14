import { Toolbar } from './Toolbar'

export const Header = ({ onOpenLogs, onClean, onOpenSettings }: {
  onOpenLogs: () => void; onClean: () => void; onOpenSettings: () => void
}) => (
  <div className="dt-panel-header">
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Live Test</h1>
        <div className="flex items-center gap-2 text-xs">
          <button className="underline" onClick={onOpenLogs}>Logs</button>
          <button className="underline" onClick={onOpenSettings}>Settings</button>
        </div>
      </div>
      <Toolbar onOpenLogs={onOpenLogs} onClean={onClean} onOpenSettings={onOpenSettings} />
    </div>
  </div>
)
