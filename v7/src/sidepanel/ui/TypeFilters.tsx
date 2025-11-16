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
    { key: 'error', label: 'error' },
    { key: 'runtime_error', label: 'failed' },
    { key: 'warn', label: 'warn' },
    { key: 'info', label: 'info' },
    { key: 'ok', label: 'ok' },
    { key: 'pending', label: 'pending' },
    { key: 'disabled', label: 'disabled' },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {types.map(({ key, label }) => {
        const count = counts[key] || 0
        const colors = resultColors[key as keyof typeof resultColors]
        const isActive = show[key]

        return (
          <button
            key={key}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all ${
              isActive ? colors.badge : 'bg-gray-100 text-gray-500'
            } ${isActive ? 'border-2 ' + colors.border : 'border-2 border-gray-200'}`}
            onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
          >
            <span>{label}</span>
            <span className="font-semibold">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
