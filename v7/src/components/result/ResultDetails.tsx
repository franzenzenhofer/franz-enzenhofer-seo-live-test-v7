import type { Result } from '@/shared/results'

const isHttpUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//i.test(value)

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
  const entries = Object.entries(details).filter(([key]) => key !== 'domPath' && key !== 'domPaths')
  if (!entries.length) return null
  return (
    <div className="mt-2 border-t pt-2 space-y-2 text-xs">
      {entries.map(([key, value]) => {
        const label = key.toUpperCase()
        return (
          <div key={key}>
            <span className="font-semibold uppercase tracking-wide text-[10px] text-slate-500">{label}</span>
          {isHttpUrl(value) ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-words rounded border bg-white/60 p-2 text-[11px] text-blue-700 underline"
            >
              {value}
            </a>
          ) : (
            <pre className="mt-1 whitespace-pre-wrap break-words bg-white/60 p-2 rounded border text-[11px]">
              {formatValue(value)}
            </pre>
          )}
          </div>
        )
      })}
    </div>
  )
}
