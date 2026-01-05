import type { RunStatus } from '@/shared/runStatus'
import { formatEuropeanDateTime } from '@/shared/dateFormat'

export type RunMetaDisplayProps = {
  runId?: string
  ranAt?: string
  status?: RunStatus
  onOpenReport?: () => void
}

const statusColors: Record<RunStatus, string> = {
  pending: 'bg-sky-100 text-sky-800',
  running: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  aborted: 'bg-slate-100 text-slate-600',
  error: 'bg-red-100 text-red-800',
  skipped: 'bg-gray-100 text-gray-600',
}

export const RunMetaDisplay = ({ runId, ranAt, status, onOpenReport }: RunMetaDisplayProps) => {
  if (!runId && !ranAt && !status) return null
  const statusLabel = status ? status.replace('_', ' ') : null

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[9px] leading-tight text-gray-600">
      {status && (
        <span className={`px-1.5 py-0.5 rounded font-semibold uppercase ${statusColors[status]}`}>
          {statusLabel}
        </span>
      )}
      {ranAt && <span>{formatEuropeanDateTime(ranAt)}</span>}
      {runId && (
        <button
          onClick={onOpenReport}
          className="hover:text-blue-600 underline decoration-gray-300 hover:decoration-blue-600 font-mono truncate"
          title={runId}
        >
          #{runId}
        </button>
      )}
    </div>
  )
}
