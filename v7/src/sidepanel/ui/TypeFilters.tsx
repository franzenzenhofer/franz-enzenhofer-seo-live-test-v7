import type { Result } from '@/shared/results'
import { getResultColor, getResultLabel, resultTypeOrder } from '@/shared/colors'
import { computeResultCoverage } from '@/shared/resultCoverage'

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
  const { totalRules, missingRules } = computeResultCoverage(results)
  const showMissing = debugEnabled && missingRules.length > 0
  return (
    <>
      <div className="text-xs text-gray-600 flex items-center gap-3 mb-1">
        <span>Total {totalRules}</span>
        {showMissing && <span className="text-red-600 font-semibold">Missing {missingRules.length}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {resultTypeOrder.map((type) => {
          const count = counts[type] || 0
          const colors = getResultColor(type)
          const isActive = show[type]
          const handleClick = () => {
            const currentlyOnlyThis = show[type] && resultTypeOrder.every((key) => (key === type ? show[key] : !show[key]))
            if (currentlyOnlyThis) {
              setShow(() =>
                resultTypeOrder.reduce<Record<string, boolean>>((acc, key) => {
                  acc[key] = true
                  return acc
                }, {}),
              )
              return
            }
            setShow(() =>
              resultTypeOrder.reduce<Record<string, boolean>>((acc, key) => {
                acc[key] = key === type
                return acc
              }, {}),
            )
          }
          return (
            <button
              key={type}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all ${
                isActive ? colors.badge : 'bg-gray-100 text-gray-500'
              } ${isActive ? 'border-2 ' + colors.border : 'border-2 border-gray-200'}`}
              onClick={handleClick}
            >
              <span>{getResultLabel(type)}</span>
              <span className="font-semibold">{count}</span>
            </button>
          )
        })}
      </div>
      {showMissing && (
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
