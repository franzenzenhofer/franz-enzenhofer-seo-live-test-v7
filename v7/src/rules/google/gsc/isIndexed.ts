import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'Is indexed (via impressions)'

export const gscIsIndexedRule: Rule = {
  id: 'gsc:is-indexed',
  name: NAME,
  enabled: true,
  what: 'gsc',
  meta: {
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
      'https://developers.google.com/webmaster-tools/search-console-api-original/v3/how-tos/search_analytics',
    ],
    description: "Uses a Search Analytics query filtered to the exact page URL: impressions > 0 -> ok 'Indexed', 0 -> warn 'might not be indexed'.",
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

    const { property, type: propertyType } = derived
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }] }
    try {
      const r = await gscFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) {
        return {
          label: 'GSC',
          message: `GSC query error ${r.status}`,
          type: 'warn',
          priority: 200,
          name: NAME,
          details: { url: page.url, property, propertyType, status: r.status },
        }
      }
      const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number }> }
      const imp = (j.rows || []).reduce((a, x)=> a + (x.impressions || 0), 0)
      return imp > 0
        ? { label: 'GSC', message: `Indexed (impressions ${imp})`, type: 'ok', priority: 800, name: NAME, details: { url: page.url, property, propertyType, impressions: imp, apiResponse: j } }
        : { label: 'GSC', message: 'No impressions (might not be indexed)', type: 'warn', priority: 300, name: NAME, details: { url: page.url, property, propertyType, impressions: 0, apiResponse: j } }
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
