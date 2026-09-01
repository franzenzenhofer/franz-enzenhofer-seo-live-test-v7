import type { Result } from '@/shared/results'

/**
 * Live run progress. Network-bound rules (PageSpeed ~20s) finish long after the
 * ~120 cheap DOM rules, so without this the panel looks stuck while it is not.
 */
export const RunProgress = ({ results }: { results: Result[] }) => {
  const total = results.length
  const pending = results.filter((r) => r.type === 'pending').length
  if (!total || !pending) return null
  const done = total - pending
  const pct = Math.round((done / total) * 100)
  return (
    <div className="space-y-1" data-testid="run-progress">
      <div className="flex items-baseline justify-between text-xs font-medium text-violet-800">
        <span>
          Running rules <span className="font-semibold">{done}</span> / {total}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full rounded-full bg-violet-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-500">
        {pending} still running - slow checks (PageSpeed, Search Console) finish last.
      </div>
    </div>
  )
}
