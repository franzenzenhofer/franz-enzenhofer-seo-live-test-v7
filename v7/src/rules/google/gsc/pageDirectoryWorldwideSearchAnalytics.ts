import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

export const gscDirectoryWorldwideRule: Rule = {
  id: 'gsc:directory-worldwide',
  name: 'GSC directory worldwide analytics',
  enabled: true,
  what: 'gsc',
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

    const { property, type: propertyType } = derived
    const dir = page.url.replace(/\/?[^/]*$/, '/')
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'contains', expression: dir }] }], rowLimit: 10 }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: "googleRule" }
    const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number }> }
    const imp = (j.rows || []).reduce((a, x)=> a + (x.impressions || 0), 0)
    return { label: 'GSC', message: `Directory impressions ${imp}`, type: 'info', name: "googleRule", details: { url: page.url, property, propertyType, directory: dir, impressions: imp, apiResponse: j } }
  },
}

