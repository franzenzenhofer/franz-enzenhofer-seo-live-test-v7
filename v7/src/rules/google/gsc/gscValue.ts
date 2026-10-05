/** Search Analytics rows and their totals, shared by the GSC rules. */

export type SearchAnalyticsRow = { keys?: string[]; clicks?: number; impressions?: number }

const sum = (rows: SearchAnalyticsRow[], key: 'clicks' | 'impressions'): number =>
  rows.reduce((total, row) => total + (row[key] || 0), 0)

/** Totals of an aggregate Search Analytics answer. */
export const totalsOf = (rows: SearchAnalyticsRow[] | undefined): { impressions: number; clicks: number } => {
  const list = rows || []
  return { impressions: sum(list, 'impressions'), clicks: sum(list, 'clicks') }
}
