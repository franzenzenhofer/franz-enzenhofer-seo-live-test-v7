import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import { topQueriesValue, type SearchAnalyticsRow } from './gscValue'
import { searchAnalyticsPeriod, searchAnalyticsScope, gscRequestIssue } from './searchAnalyticsContext'

import type { Rule } from '@/core/types'

const NAME = 'Top queries of page'

export const gscTopQueriesOfPageRule: Rule = {
  id: 'gsc:top-queries-of-page',
  name: NAME,
  enabled: true,
  what: 'gsc',
  meta: {
    userGuide: {
      check: "Lists up to 25 queries returned for this exact page during the displayed period, ordered by clicks. These are available query rows, not a complete record of every search.",
      action: "Use these queries to understand search demand. Compare the same URL, search type and dates in Search Console; omitted or anonymized queries mean row totals may differ from page totals.",
    },
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
      'https://developers.google.com/webmaster-tools/search-console-api-original/v3/how-tos/search_analytics',
    ],
    description: 'Lists the top Search Analytics queries (with impressions) for the exact page URL as an info result.',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult('GSC', NAME)

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url, NAME)

    const { property, type: propertyType } = derived
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensions: ['query','page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }], rowLimit: 25 }
    try {
      const r = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) return gscRequestIssue(r.status, NAME, page.url, property)
      const j = await r.json() as { rows?: SearchAnalyticsRow[] }
      const queries = (j.rows || []).map(row => ({ query: row.keys?.[0] || '(query unavailable)', clicks: row.clicks || 0, impressions: row.impressions || 0 }))
      return {
        label: 'GSC',
        message: queries.length ? `${queries.length} search queries reported, ordered by clicks.` : 'No search queries reported for this URL and period.',
        type: 'info',
        priority: 750,
        name: NAME,
        details: { url: page.url, value: topQueriesValue(j.rows), property, propertyType, queries, returnedQueryCount: queries.length, requestedQueryLimit: 25, ...searchAnalyticsScope(period), apiResponse: j },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        label: 'GSC',
        message: `GSC request failed: ${message}`,
        type: 'runtime_error',
        name: NAME,
        priority: -1000,
        details: { url: page.url, property, propertyType },
      }
    }
  },
}
