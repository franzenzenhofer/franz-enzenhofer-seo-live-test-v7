import { RunNow } from './RunNow'

export const Toolbar = ({
  onOpenLogs,
  onClean,
  onOpenSettings,
}: {
  onOpenLogs: () => void
  onClean: () => void
  onOpenSettings: () => void
}) => (
  <div className="flex items-center gap-3 text-sm">
    <button className="underline" onClick={onOpenLogs}>
      Logs
    </button>
    <button className="underline" onClick={onClean}>
      Clean
    </button>
    <div className="flex-1 flex justify-center">
      <RunNow />
    </div>
    <button className="underline" onClick={onOpenSettings}>
      Settings
    </button>
  </div>
)
