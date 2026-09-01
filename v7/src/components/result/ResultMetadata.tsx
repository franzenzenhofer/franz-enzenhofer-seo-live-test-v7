import type { Result } from '@/shared/results'

export const ResultMetadata = ({ result, number }: { result: Result; number: number | null }) => (
  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
    {result.what && <span className="rounded bg-blue-100 px-1.5 py-0.5 font-semibold uppercase text-blue-800">{result.what}</span>}
    {typeof result.priority === 'number' && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold uppercase text-slate-600">P{result.priority}</span>}
    {number !== null && <span>#{number}</span>}
    {result.ruleId && <span className="font-mono" title="Rule ID">{result.ruleId}</span>}
  </div>
)
