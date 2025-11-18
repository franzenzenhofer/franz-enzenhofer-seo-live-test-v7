import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'Top queries of page'

export const gscTopQueriesOfPageRule: Rule = {
  id: 'gsc:top-queries-of-page',
  name: NAME,
  enabled: true,
  what: 'gsc',
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

    const { property, type: propertyType } = derived
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['query','page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }], rowLimit: 5 }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: NAME }
    const j = await r.json() as { rows?: Array<{ keys?: string[], clicks?: number, impressions?: number }> }
    const rows = (j.rows || []).map(r => `${(r.keys||[])[0]||''} (${r.impressions||0})`).join(', ')
    return { label: 'GSC', message: `Top queries: ${rows || 'none'}`, type: 'info', name: NAME, details: { url: page.url, property, propertyType, topQueries: j.rows, apiResponse: j } }
  },
}

