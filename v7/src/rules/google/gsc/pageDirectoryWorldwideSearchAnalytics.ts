import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import { searchAnalyticsValue, totalsOf, type SearchAnalyticsRow } from './gscValue'
import { searchAnalyticsPeriod, searchAnalyticsScope, gscRequestIssue } from './searchAnalyticsContext'

import type { Rule } from '@/core/types'

const NAME = 'Directory worldwide analytics'

export const gscDirectoryWorldwideRule: Rule = {
  id: 'gsc:directory-worldwide',
  name: NAME,
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
    if (!token) return createNoTokenResult('GSC', NAME)

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url, NAME)

    const { property, type: propertyType } = derived
    const directoryUrl = new URL(page.url)
    const dir = directoryUrl.origin + directoryUrl.pathname.replace(/[^/]*$/, '')
    const prefixPattern = '^' + dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const period = searchAnalyticsPeriod()
    const body = { ...period, type: 'web', dataState: 'final', dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'includingRegex', expression: prefixPattern }] }] }
    try {
      const r = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) return gscRequestIssue(r.status, NAME, page.url, property)
      const j = await r.json() as { rows?: SearchAnalyticsRow[] }
      const { impressions: imp, clicks: cl } = totalsOf(j.rows)
      return {
        label: 'GSC',
        message: `Directory impressions ${imp}.`,
        type: 'info',
        priority: 750,
        name: NAME,
        details: { url: page.url, value: searchAnalyticsValue(imp, cl), property, propertyType, directory: dir, impressions: imp, clicks: cl, ...searchAnalyticsScope(period), apiResponse: j },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        label: 'GSC',
        message: `GSC request failed: ${message}`,
        type: 'runtime_error',
        name: NAME,
        priority: -1000,
        details: { url: page.url, property, propertyType, directory: dir },
      }
    }
  },
}
