/**
 * The judged value of a GSC result: the numbers, queries and verdicts a person
 * wants at a glance in the collapsed card - never the property the data came from.
 */

export type SearchAnalyticsRow = { keys?: string[]; clicks?: number; impressions?: number }

const sum = (rows: SearchAnalyticsRow[], key: 'clicks' | 'impressions'): number =>
  rows.reduce((total, row) => total + (row[key] || 0), 0)

/** Totals of an aggregate Search Analytics answer. */
export const totalsOf = (rows: SearchAnalyticsRow[] | undefined): { impressions: number; clicks: number } => {
  const list = rows || []
  return { impressions: sum(list, 'impressions'), clicks: sum(list, 'clicks') }
}

export const searchAnalyticsValue = (impressions: number, clicks: number): string =>
  `${impressions} impressions, ${clicks} clicks`

export const impressionsValue = (impressions: number): string => `${impressions} impressions`

/** `franz enzenhofer (961), full stack optimization (1080)` - empty when there are no rows. */
export const topQueriesValue = (rows: SearchAnalyticsRow[] | undefined, limit = 5): string =>
  (rows || [])
    .slice(0, limit)
    .map((row) => `${(row.keys || [])[0] || ''} (${row.impressions || 0})`)
    .join(', ')

export const relativeTime = (iso?: string | null): string => {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 60) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? '' : 's'} ago`
}

/** `Submitted and indexed (PASS), last crawled 3 days ago` */
export const inspectionValue = (coverage: string, verdict: string, lastCrawl?: string | null): string => {
  const crawled = relativeTime(lastCrawl)
  return `${coverage} (${verdict})${crawled ? `, last crawled ${crawled}` : ''}`
}
