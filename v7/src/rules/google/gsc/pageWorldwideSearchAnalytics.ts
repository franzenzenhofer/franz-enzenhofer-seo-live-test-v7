import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import { searchAnalyticsPeriod, searchAnalyticsScope } from './searchAnalyticsContext'
import { gscNoTokenFacts, gscPropertyMissingFacts, gscApiIssueFacts, gscNetworkErrorFacts, GSC_NOT_MARKUP } from './gscFacts'

import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Page worldwide analytics'
const API = 'Search Console searchAnalytics.query (page filter)'

export const gscPageWorldwideRule: Rule = {
  id: 'gsc:page-worldwide',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'gsc',
  meta: {
    userGuide: {
      check: "Reports clicks and impressions for the exact page URL over the displayed 90-day period, across all countries and devices. These are Google web search figures, not all website visits.",
      action: "Compare the same page and dates in Search Console. If figures are missing, check the canonical URL and available reporting dates before changing the website.",
    },
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
    ],
    description: 'Reports worldwide Search Analytics impressions and clicks for the tested page URL as an info result.',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return presentResult(gscPageWorldwideRule, page, gscNoTokenFacts())

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return presentResult(gscPageWorldwideRule, page, gscPropertyMissingFacts(page.url))

    const { property, type: propertyType } = derived
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }] }
    let j: { rows?: Array<{ clicks?: number, impressions?: number, keys?: string[] }> }
    try {
      const response = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!response.ok) return presentResult(gscPageWorldwideRule, page, gscApiIssueFacts(API, response.status, property, propertyType))
      j = await response.json() as { rows?: Array<{ clicks?: number, impressions?: number, keys?: string[] }> }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return presentResult(gscPageWorldwideRule, page, gscNetworkErrorFacts(API, message, property, propertyType))
    }

    const row = (j.rows || []).find((r) => (r.keys || [])[0] === page.url)
    const imp = row?.impressions || 0
    const cl = row?.clicks || 0
    const scope = searchAnalyticsScope(period)

    return presentResult(gscPageWorldwideRule, page, {
      input: 'Page URL + Search Console API response',
      type: 'info',
      priority: 750,
      values: [textField('Impressions', imp), textField('Clicks', cl)],
      detailValues: [textField('Property', property), textField('Property type', propertyType)],
      checked: [
        textField('API', API),
        textField('Reporting period', scope.reportingPeriod), textField('Search type', scope.searchType),
        textField('Data availability', scope.dataAvailability), textField('Metric definitions', scope.metricDefinitions),
      ],
      noMarkup: GSC_NOT_MARKUP,
    })
  },
}
