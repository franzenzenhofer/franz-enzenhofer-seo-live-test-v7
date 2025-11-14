import type { Result } from '@/shared/results'

const formatValue = (value: unknown) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const ResultDetails = ({ details }: { details?: Result['details'] }) => {
  if (!details) return null
  const entries = Object.entries(details)
  if (!entries.length) return null
  return (
    <div className="mt-2 border-t pt-2 space-y-2 text-xs">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="font-semibold uppercase tracking-wide text-[10px] text-slate-500">{key}</span>
          <pre className="mt-1 whitespace-pre-wrap break-words bg-white/60 p-2 rounded border text-[11px]">
            {formatValue(value)}
          </pre>
        </div>
      ))}
    </div>
  )
}
