import type { Result } from '@/shared/results'
import { resultColors } from '@/shared/colorDefs'

type Props = {
  show: Record<string, boolean>
  setShow: (u: (s: Record<string, boolean>) => Record<string, boolean>) => void
  results: Result[]
}

export const TypeFilters = ({ show, setShow, results }: Props) => {
  const counts = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const types: Array<{ key: string; label: string }> = [
    { key: 'ok', label: 'ok' },
    { key: 'warn', label: 'warn' },
    { key: 'error', label: 'error' },
    { key: 'info', label: 'info' },
  ]

  return (
    <div className="flex items-center gap-2">
      {types.map(({ key, label }) => {
        const count = counts[key] || 0
        const colors = resultColors[key as keyof typeof resultColors]
        const isActive = show[key]

        return (
          <button
            key={key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              isActive ? colors.badge : 'bg-gray-100 text-gray-500'
            } ${isActive ? 'border-2 ' + colors.border : 'border-2 border-gray-200'}`}
            onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
          >
            <span className={`w-3 h-3 flex items-center justify-center ${isActive ? '' : 'opacity-30'}`}>
              {isActive ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span className="w-2.5 h-2.5 border-2 border-current rounded-sm"></span>
              )}
            </span>
            <span>{label}</span>
            <span className={`font-semibold ${isActive ? '' : 'opacity-50'}`}>({count})</span>
          </button>
        )
      })}
    </div>
  )
}
