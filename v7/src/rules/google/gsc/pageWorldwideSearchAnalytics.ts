import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'page worldwide analytics'

export const gscPageWorldwideRule: Rule = {
  id: 'gsc:page-worldwide',
  name: NAME,
  enabled: true,
  what: 'gsc',
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return createGscPropertyDerivationFailedResult(page.url)

    const { property, type: propertyType } = derived
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['page'] }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: NAME }
    const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number, keys?: string[] }> }
    const row = (j.rows || []).find(r => (r.keys||[])[0] === page.url)
    const imp = row?.impressions || 0
    const cl = row?.clicks || 0
    return { label: 'GSC', message: `Impressions ${imp}, Clicks ${cl}`, type: 'info', name: NAME, details: { url: page.url, property, propertyType, impressions: imp, clicks: cl, apiResponse: j } }
  },
}

