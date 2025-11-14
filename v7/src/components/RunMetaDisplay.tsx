import { formatEuropeanDateTime } from '@/shared/dateFormat'

export type RunMetaDisplayProps = {
  runId?: string
  ranAt?: string
  onOpenReport?: () => void
}

export const RunMetaDisplay = ({ runId, ranAt, onOpenReport }: RunMetaDisplayProps) => {
  if (!runId && !ranAt) return null

  return (
    <div className="text-xs text-gray-600">
      {runId && (
        <button
          onClick={onOpenReport}
          className="hover:text-blue-600 underline decoration-gray-300 hover:decoration-blue-600"
        >
          #{runId}
        </button>
      )}
      {runId && ranAt && <span> - </span>}
      {ranAt && <span>{formatEuropeanDateTime(ranAt)}</span>}
    </div>
  )
}
