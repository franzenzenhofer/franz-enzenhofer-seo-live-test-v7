import type { MouseEvent } from 'react'

import { TypeFilterChip } from './TypeFilterChip'

import type { Result } from '@/shared/results'
import { resultTypeOrder } from '@/shared/colors'
import { computeResultCoverage } from '@/shared/resultCoverage'
import { clearTypeFilter, isFiltered, soloType, toggleType } from '@/shared/typeFilterSelection'

type Props = {
  show: Record<string, boolean>
  setShow: (u: (s: Record<string, boolean>) => Record<string, boolean>) => void
  results: Result[]
  debugEnabled: boolean
}

export const TypeFilters = ({ show, setShow, results, debugEnabled }: Props) => {
  const counts = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const { totalRules, coveredRules, missingRules } = computeResultCoverage(results)
  const showMissingList = debugEnabled && missingRules.length > 0
  const filtering = isFiltered(show)

  const handle = (type: string) => (event: MouseEvent<HTMLButtonElement>) => {
    if (event.altKey) { setShow(() => soloType(type)); return }
    setShow((prev) => toggleType(prev, type))
  }

  return (
    <>
      {debugEnabled && <div className="text-xs text-gray-600 flex items-center gap-3 mb-1">
        <span>Coverage {coveredRules}/{totalRules}</span>
        {missingRules.length > 0 && <span className="text-red-600 font-semibold">Missing {missingRules.length}</span>}
      </div>}
      <div className="flex items-center gap-2 flex-wrap">
        {resultTypeOrder.map((type) => (
          <TypeFilterChip
            key={type}
            type={type}
            count={counts[type] || 0}
            selected={Boolean(show[type])}
            filtering={filtering}
            onClick={handle(type)}
          />
        ))}
        {filtering && (
          <button
            type="button"
            onClick={() => setShow(() => clearTypeFilter())}
            className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Show all
          </button>
        )}
      </div>
      {showMissingList && (
        <details className="mt-2 w-full rounded border border-red-100 bg-red-50 p-2 text-xs text-red-700">
          <summary className="cursor-pointer select-none font-semibold">Show missing rules</summary>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            {missingRules.map((rule) => (
              <li key={rule.id}>
                {rule.name} <span className="text-red-500">({rule.id})</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
