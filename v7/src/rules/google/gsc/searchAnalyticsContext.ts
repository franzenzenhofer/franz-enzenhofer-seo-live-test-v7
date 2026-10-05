import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

/** Ninety complete calendar days in Search Console's Pacific time zone. */
export const searchAnalyticsPeriod = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)?.value
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`)
  const date = (days: number) => new Date(today - days * 86_400_000).toISOString().slice(0, 10)
  return { startDate: date(90), endDate: date(1) }
}

/** The reporting period as the overview row the figures refer to (FORMATTING.md: what was compared against). */
export const periodRow = (period: ReturnType<typeof searchAnalyticsPeriod>): DisplayField =>
  textField('Period', `${period.startDate} to ${period.endDate}`)

export const searchAnalyticsScope = (period: ReturnType<typeof searchAnalyticsPeriod>) => ({
  reportingPeriod: `${period.startDate} to ${period.endDate}, inclusive (Pacific time)`,
  searchType: 'Google web search, all countries and devices',
  dataAvailability: 'Finalized data only; recent days can be missing. Zero reported activity does not prove that a page is absent from the index.',
  metricDefinitions: 'Impressions count appearances in search results; clicks count visits from those results. Search Console usually assigns page data to the canonical URL.',
})
