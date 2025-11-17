import { formatEuropeanDateTime } from '@/shared/dateFormat'

export type RunMetaDisplayProps = {
  runId?: string
  ranAt?: string
  onOpenReport?: () => void
}

const parseTabIdFromRunId = (runId: string): string | null => {
  const match = runId.match(/^run-(\d+)-/)
  return match?.[1] ?? null
}

export const RunMetaDisplay = ({ runId, ranAt, onOpenReport }: RunMetaDisplayProps) => {
  if (!runId && !ranAt) return null
  const tabId = runId ? parseTabIdFromRunId(runId) : null

  return (
    <div className="text-xs text-gray-600 space-y-1">
      <div className="flex items-center gap-2">
        {tabId && <span className="font-mono text-gray-500">Tab {tabId}</span>}
        {runId && (
          <button
            onClick={onOpenReport}
            className="hover:text-blue-600 underline decoration-gray-300 hover:decoration-blue-600 font-mono"
          >
            #{runId}
          </button>
        )}
      </div>
      {ranAt && <div className="text-gray-500">{formatEuropeanDateTime(ranAt)}</div>}
    </div>
  )
}
