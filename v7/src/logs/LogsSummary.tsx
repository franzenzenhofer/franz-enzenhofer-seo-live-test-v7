const parseNumberField = (log: string | undefined, key: string) => {
  if (!log) return null
  const match = log.match(new RegExp(`${key}=([^\\s]+)`))
  if (!match || !match[1]) return null
  const cleaned = match[1].replace(/^"(.*)"$/, '$1')
  const num = Number(cleaned)
  return Number.isNaN(num) ? null : num
}

export const LogsSummary = ({ logs }: { logs: string[] }) => {
  const start = [...logs].reverse().find((log) => log.includes('rules:start'))
  const done = [...logs].reverse().find((log) => log.includes('rules:done'))
  if (!start) return null
  const total = parseNumberField(start, 'total')
  const enabled = parseNumberField(start, 'enabled')
  const results = parseNumberField(done, 'total')
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm text-slate-600 flex gap-4 flex-wrap">
      <span>Rules total: {total ?? 'n/a'}</span>
      <span>Enabled: {enabled ?? 'n/a'}</span>
      <span>Results logged: {results ?? 'n/a'}</span>
    </div>
  )
}
