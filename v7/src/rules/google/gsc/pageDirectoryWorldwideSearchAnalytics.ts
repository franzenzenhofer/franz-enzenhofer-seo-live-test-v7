import { gscFetch } from '../googleFetch'
import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'Directory worldwide analytics'

export const gscDirectoryWorldwideRule: Rule = {
  id: 'gsc:directory-worldwide',
  name: NAME,
  enabled: true,
  what: 'gsc',
  meta: {
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
    ],
    description: "Reports total Search Analytics impressions for pages in the current URL's directory (page-contains filter, aggregate query) as an info result.",
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

    const { property, type: propertyType } = derived
    const dir = page.url.replace(/\/?[^/]*$/, '/')
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'contains', expression: dir }] }] }
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
      return {
        label: 'GSC',
        message: `Directory impressions ${imp}.`,
        type: 'info',
        priority: 750,
        name: NAME,
        details: { url: page.url, property, propertyType, directory: dir, impressions: imp, apiResponse: j },
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
