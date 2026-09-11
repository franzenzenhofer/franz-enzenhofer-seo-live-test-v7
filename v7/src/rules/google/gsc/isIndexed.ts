import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import { impressionsValue, totalsOf, type SearchAnalyticsRow } from './gscValue'
import { searchAnalyticsPeriod, searchAnalyticsScope } from './searchAnalyticsContext'
import { gscNoTokenFacts, gscPropertyMissingFacts, gscApiIssueFacts, gscNetworkErrorFacts, GSC_NOT_MARKUP } from './gscFacts'

import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Historical search impressions'
const API = 'Search Console searchAnalytics.query (page filter)'

export const gscIsIndexedRule: Rule = {
  id: 'gsc:is-indexed',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'gsc',
  meta: {
    userGuide: {
      check: "Shows reported search appearances for this exact URL during the displayed 90-day period. Historical impressions do not establish whether Google indexes the page now.",
      action: "Use the URL Inspection result to investigate indexing. Compare this exact URL and date range in Search Console, including the Google-selected canonical URL.",
    },
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
      'https://developers.google.com/webmaster-tools/search-console-api-original/v3/how-tos/search_analytics',
    ],
    description: 'Reports historical search impressions over a stated period without inferring current indexing.',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return presentResult(gscIsIndexedRule, page, gscNoTokenFacts())

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return presentResult(gscIsIndexedRule, page, gscPropertyMissingFacts(page.url))

    const { property, type: propertyType } = derived
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }] }
    let response: Response
    try {
      response = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return presentResult(gscIsIndexedRule, page, gscNetworkErrorFacts(API, message, property, propertyType))
    }
    if (!response.ok) return presentResult(gscIsIndexedRule, page, gscApiIssueFacts(API, response.status, property, propertyType))

    const j = await response.json() as { rows?: SearchAnalyticsRow[] }
    const { impressions: imp } = totalsOf(j.rows)
    const scope = searchAnalyticsScope(period)
    return presentResult(gscIsIndexedRule, page, {
      input: 'Page URL + Search Console API response',
      type: 'info',
      priority: 800,
      values: [textField('Historical search impressions', impressionsValue(imp))],
      detailValues: [textField('Property', property), textField('Property type', propertyType)],
      checked: [
        textField('API', API),
        textField('Reporting period', scope.reportingPeriod),
        textField('Search type', scope.searchType),
        textField('Data state', 'final'),
        textField('Filter', 'page equals the tested page URL'),
        textField('Metric', 'Impressions, summed over the returned rows'),
        textField('Criterion', 'None - informational observation without a pass/fail threshold'),
      ],
      noMarkup: GSC_NOT_MARKUP,
    })
  },
}
