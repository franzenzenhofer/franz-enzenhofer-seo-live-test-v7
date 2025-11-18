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
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-center gap-1.5 text-[9px] leading-tight text-gray-600">
        {ranAt && <span>{formatEuropeanDateTime(ranAt)}</span>}
        {tabId && <span className="font-mono text-gray-500 shrink-0">Tab {tabId}</span>}
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
    </div>
  )
}
