import type { RuleSummary } from '@/rules/inventory'

type Props = {
  totalRules: number
  resultsCount: number
  missing: RuleSummary[]
  debugEnabled: boolean
}

export const ResultSummary = ({ totalRules, resultsCount, missing, debugEnabled }: Props) => (
  <div className="rounded border border-gray-200 bg-white p-3 text-xs text-gray-700 space-y-1">
    <div className="flex flex-wrap gap-3">
      <span>Total rules: {totalRules}</span>
      <span>Results received: {resultsCount}</span>
      {debugEnabled && (
        <span className={missing.length ? 'text-red-600 font-semibold' : ''}>Missing: {missing.length}</span>
      )}
    </div>
    {debugEnabled && !!missing.length && (
      <div>
        <p className="font-semibold text-red-600">Missing results:</p>
        <ul className="list-disc pl-4">
          {missing.map((rule) => (
            <li key={rule.id}>
              {rule.name} <span className="text-gray-500">({rule.id})</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)
