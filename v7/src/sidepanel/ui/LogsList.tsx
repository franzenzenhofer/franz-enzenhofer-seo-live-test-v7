/**
 * Logs List - Renders list of log entries
 */

import { LogEntry } from './LogEntry'

export function LogsList({
  logs,
  selectedLogs,
  copiedLog,
  onToggleSelect,
  onCopy,
}: {
  logs: string[]
  selectedLogs: Set<number>
  copiedLog: number | null
  onToggleSelect: (index: number) => void
  onCopy: (log: string, index: number) => void
}) {
  if (logs.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No logs yet.
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {logs.map((log, i) => (
        <LogEntry
          key={i}
          log={log}
          index={i}
          isSelected={selectedLogs.has(i)}
          isCopied={copiedLog === i}
          onToggleSelect={() => onToggleSelect(i)}
          onCopy={() => onCopy(log, i)}
        />
      ))}
    </div>
  )
}
