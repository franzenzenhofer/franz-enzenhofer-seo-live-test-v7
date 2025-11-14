import type { useRunMeta } from './useRunMeta'
import { RestrictedBanner } from './RestrictedBanner'

type RunMeta = ReturnType<typeof useRunMeta>

export const RestrictedInfo = ({ error, runMeta }: { error: unknown; runMeta: RunMeta }) => {
  if (!runMeta && !error) return null
  return (
    <div className="p-3 space-y-1">
      <RestrictedBanner message={String(error || 'Content scripts cannot run on this page.')} />
      {runMeta?.url && (
        <p className="text-xs text-amber-700 space-x-1">
          <span>Showing cached results from {runMeta.url}.</span>
          <span>
            Run {runMeta.runId ? `#${runMeta.runId}` : '(unknown)'}
            {runMeta.ranAt ? ` · ${new Date(runMeta.ranAt).toLocaleString()}` : ''}
          </span>
        </p>
      )}
    </div>
  )
}
