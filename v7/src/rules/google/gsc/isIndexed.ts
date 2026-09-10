import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import { impressionsValue, totalsOf, type SearchAnalyticsRow } from './gscValue'
import { searchAnalyticsPeriod, searchAnalyticsScope, gscRequestIssue } from './searchAnalyticsContext'

import type { Rule } from '@/core/types'

const NAME = 'Historical search impressions'

export const gscIsIndexedRule: Rule = {
  id: 'gsc:is-indexed',
  name: NAME,
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
    if (!token) return createNoTokenResult('GSC', NAME)

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url, NAME)

    const { property, type: propertyType } = derived
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }] }
    try {
      const r = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) return gscRequestIssue(r.status, NAME, page.url, property)
      const j = await r.json() as { rows?: SearchAnalyticsRow[] }
      const { impressions: imp } = totalsOf(j.rows)
      return { label: 'GSC', message: imp > 0 ? `Historical search impressions: ${imp}; this does not establish current indexing.` : 'No search impressions reported; indexing state cannot be inferred from this.',
        type: 'info', priority: 800, name: NAME, details: { url: page.url, value: impressionsValue(imp), property, propertyType, impressions: imp, ...searchAnalyticsScope(period), apiResponse: j } }
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
