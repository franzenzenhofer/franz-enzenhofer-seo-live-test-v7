import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import { type SearchAnalyticsRow } from './gscValue'
import { periodRow, searchAnalyticsPeriod, searchAnalyticsScope } from './searchAnalyticsContext'
import { gscNoTokenFacts, gscPropertyMissingFacts, gscApiIssueFacts, gscNetworkErrorFacts, propertyFields, GSC_API_INPUT, GSC_NOT_MARKUP } from './gscFacts'

import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Top queries of page'
const API = 'Search Console searchAnalytics.query (query x page, rowLimit 25)'
const REQUESTED_ROW_LIMIT = 25

export const gscTopQueriesOfPageRule: Rule = {
  id: 'gsc:top-queries-of-page',
  name: NAME,
  presentation: 1,
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
    if (!token) return presentResult(gscTopQueriesOfPageRule, page, gscNoTokenFacts())

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return presentResult(gscTopQueriesOfPageRule, page, gscPropertyMissingFacts(page.url))

    const { property, type: propertyType } = derived
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensions: ['query', 'page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }], rowLimit: REQUESTED_ROW_LIMIT }
    let j: { rows?: SearchAnalyticsRow[] }
    try {
      const response = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!response.ok) return presentResult(gscTopQueriesOfPageRule, page, gscApiIssueFacts(API, response.status, property, propertyType))
      j = await response.json() as { rows?: SearchAnalyticsRow[] }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return presentResult(gscTopQueriesOfPageRule, page, gscNetworkErrorFacts(API, message, property, propertyType))
    }

    const rows = j.rows || []
    const queries = rows.map((row) => row.keys?.[0] || 'Not found')
    const scope = searchAnalyticsScope(period)

    // Every returned query is one evidence record; the storage bound keeps the counts truthful.
    return presentResult(gscTopQueriesOfPageRule, page, {
      input: GSC_API_INPUT,
      type: 'info',
      priority: 750,
      values: [textField('Top queries', rows.length ? listRow(queries) : 'None'), textField('Queries', rows.length), periodRow(period)],
      detailValues: [...propertyFields(property, propertyType),
        ...(rows.length ? [textField('Evidence retained', rows.length), textField('Evidence omitted', 0)] : [])],
      checked: [
        textField('API', API), textField('Row limit', REQUESTED_ROW_LIMIT),
        textField('Reporting period', scope.reportingPeriod), textField('Search type', scope.searchType),
        textField('Data availability', scope.dataAvailability), textField('Metric definitions', scope.metricDefinitions),
      ],
      evidence: rows.map((row, i) => ({ name: `Query ${i + 1}`, fields: [
        textField('Query', queries[i]!), textField('Clicks', row.clicks || 0), textField('Impressions', row.impressions || 0),
      ] })),
      noMarkup: GSC_NOT_MARKUP,
    })
  },
}
