import { httpStatusLabel } from '@/shared/httpStatusLabel'
import type { Result } from '@/core/types'

/** Ninety complete calendar days in Search Console's Pacific time zone. */
export const searchAnalyticsPeriod = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)?.value
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`)
  const date = (days: number) => new Date(today - days * 86_400_000).toISOString().slice(0, 10)
  return { startDate: date(90), endDate: date(1) }
}

export const searchAnalyticsScope = (period: ReturnType<typeof searchAnalyticsPeriod>) => ({
  reportingPeriod: `${period.startDate} to ${period.endDate}, inclusive (Pacific time)`,
  searchType: 'Google web search, all countries and devices',
  dataAvailability: 'Finalized data only; recent days can be missing. Zero reported activity does not prove that a page is absent from the index.',
  metricDefinitions: 'Impressions count appearances in search results; clicks count visits from those results. Search Console usually assigns page data to the canonical URL.',
})

export const gscRequestIssue = (status: number, name: string, url: string, property: string): Result => ({
  label: 'GSC', name, type: 'runtime_error', priority: -1000,
  message: `Search Console could not complete this check: ${httpStatusLabel(status)}.`,
  details: { url, property, apiResponseStatus: httpStatusLabel(status), nextStep: status === 401
    ? 'Open Settings > Google Account, clear the saved token, sign in again and rerun.'
    : status === 403 ? 'Check that the signed-in account has access to this property and that the Search Console API is enabled for the OAuth project.'
    : status === 429 ? 'Wait for the Search Console request quota to recover, then rerun this check.'
    : 'Retry this check. If the error persists, open Search Console to check this URL and the account access directly.' },
})
