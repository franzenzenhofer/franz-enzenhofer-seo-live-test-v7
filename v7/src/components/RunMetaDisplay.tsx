import { formatEuropeanDateTime } from '@/shared/dateFormat'

export type RunMetaDisplayProps = {
  runId?: string
  ranAt?: string
  onOpenReport?: () => void
}

export const RunMetaDisplay = ({ runId, ranAt, onOpenReport }: RunMetaDisplayProps) => {
  if (!runId && !ranAt) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[9px] leading-tight text-gray-600">
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
