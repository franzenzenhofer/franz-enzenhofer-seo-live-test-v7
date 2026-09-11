import type { RunMeta } from '@/shared/runMeta'

/**
 * Run test was clicked: the run meta says `starting` (page reloading, no run
 * record yet) or `running` before the runner seeded its pending rows. Either
 * way the panel must say so instead of "No results yet. Click Run test".
 */
export const isRunStarting = (meta: RunMeta | null, resultCount: number): boolean =>
  resultCount === 0 && (meta?.status === 'starting' || meta?.status === 'running')

export const RunStarting = ({ url }: { url: string }) => (
  <div
    role="status"
    aria-live="polite"
    data-testid="run-starting"
    className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
  >
    <span aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
    <div className="space-y-0.5">
      <p className="font-semibold">Starting test run…</p>
      <p className="break-all text-amber-800">
        Reloading {url || 'the page'} with an empty cache. Results appear as soon as the page reports back.
      </p>
    </div>
  </div>
)
