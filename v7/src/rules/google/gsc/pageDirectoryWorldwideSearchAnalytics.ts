import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import { totalsOf, type SearchAnalyticsRow } from './gscValue'
import { searchAnalyticsPeriod, searchAnalyticsScope } from './searchAnalyticsContext'
import { gscNoTokenFacts, gscPropertyMissingFacts, gscApiIssueFacts, gscNetworkErrorFacts, GSC_NOT_MARKUP } from './gscFacts'

import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Directory worldwide analytics'
const API = 'Search Console searchAnalytics.query (directory prefix regex)'

export const gscDirectoryWorldwideRule: Rule = {
  id: 'gsc:directory-worldwide',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'gsc',
  meta: {
    userGuide: {
      check: "Reports search activity for URLs starting with the displayed directory URL, including nested directories. The current page query and fragment are excluded when deriving that directory.",
      action: "Check the directory and reporting period before comparing these totals with Search Console. Missing activity does not identify an indexing defect.",
    },
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
    ],
    description: "Reports total Search Analytics impressions for pages in the current URL's directory (anchored URL-prefix filter, aggregate query) as an info result.",
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return presentResult(gscDirectoryWorldwideRule, page, gscNoTokenFacts())

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return presentResult(gscDirectoryWorldwideRule, page, gscPropertyMissingFacts(page.url))

    const { property, type: propertyType } = derived
    const directoryUrl = new URL(page.url)
    const dir = directoryUrl.origin + directoryUrl.pathname.replace(/[^/]*$/, '')
    const prefixPattern = '^' + dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'includingRegex', expression: prefixPattern }] }] }
    let j: { rows?: SearchAnalyticsRow[] }
    try {
      const response = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!response.ok) {
        const facts = gscApiIssueFacts(API, response.status, property, propertyType)
        return presentResult(gscDirectoryWorldwideRule, page, { ...facts, detailValues: [...(facts.detailValues || []), urlField('Directory', dir)] })
      }
      j = await response.json() as { rows?: SearchAnalyticsRow[] }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const facts = gscNetworkErrorFacts(API, message, property, propertyType)
      return presentResult(gscDirectoryWorldwideRule, page, { ...facts, detailValues: [...(facts.detailValues || []), urlField('Directory', dir)] })
    }

    const { impressions: imp, clicks: cl } = totalsOf(j.rows)
    const scope = searchAnalyticsScope(period)

    return presentResult(gscDirectoryWorldwideRule, page, {
      input: 'Page URL + Search Console API response',
      type: 'info',
      priority: 750,
      values: [textField('Directory impressions', imp), textField('Directory clicks', cl)],
      detailValues: [urlField('Directory', dir), textField('Property', property), textField('Property type', propertyType)],
      checked: [
        textField('API', API),
        textField('Reporting period', scope.reportingPeriod), textField('Search type', scope.searchType),
        textField('Data availability', scope.dataAvailability), textField('Metric definitions', scope.metricDefinitions),
      ],
      noMarkup: GSC_NOT_MARKUP,
    })
  },
}
