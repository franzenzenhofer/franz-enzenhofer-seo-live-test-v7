const parseNumberField = (log: string | undefined, key: string) => {
  if (!log) return null
  const match = log.match(new RegExp(`${key}=([^\\s]+)`))
  if (!match || !match[1]) return null
  const cleaned = match[1].replace(/^"(.*)"$/, '$1')
  const num = Number(cleaned)
  return Number.isNaN(num) ? null : num
}

const findLatest = (logs: string[], needles: string[]) =>
  [...logs].reverse().find((log) => needles.some((needle) => log.includes(needle)))

export const extractLogsSummary = (logs: string[]) => {
  const start = findLatest(logs, ['rules:start'])
  if (!start) return { total: null, enabled: null, results: null }
  const total = parseNumberField(start, 'total')
  const enabled = parseNumberField(start, 'enabled')
  const done = findLatest(logs, ['rules:done', 'runner:done'])
  const results =
    parseNumberField(done, 'total') ??
    parseNumberField(done, 'results')
  return { total, enabled, results }
}

export const LogsSummary = ({ logs }: { logs: string[] }) => {
  const { total, enabled, results } = extractLogsSummary(logs)
  if (total === null && enabled === null && results === null) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm text-slate-600 flex gap-4 flex-wrap">
      <span>Rules total: {total ?? 'n/a'}</span>
      <span>Enabled: {enabled ?? 'n/a'}</span>
      <span>Results logged: {results ?? 'n/a'}</span>
    </div>
  )
}
