import { extractGoogleCredentials, createNoTokenResult, createMissingSiteUrlResult, extractGscSiteUrl } from '../google-utils'

import type { Rule } from '@/core/types'

export const gscIsIndexedRule: Rule = {
  id: 'gsc:is-indexed',
  name: 'GSC is indexed (via impressions)',
  enabled: false,
  what: 'gsc',
  async run(page, ctx) {
    const { token, vars } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()
    const site = extractGscSiteUrl(vars)
    if (!site) return createMissingSiteUrlResult()
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }] }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: "googleRule", details: { url: page.url, site, status: r.status } }
    const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number }> }
    const imp = (j.rows || []).reduce((a, x)=> a + (x.impressions || 0), 0)
    return imp > 0
      ? { label: 'GSC', message: `Indexed (impressions ${imp})`, type: 'ok', name: "googleRule", details: { url: page.url, site, impressions: imp, apiResponse: j } }
      : { label: 'GSC', message: 'No impressions (might not be indexed)', type: 'warn', name: "googleRule", details: { url: page.url, site, impressions: 0, apiResponse: j } }
  },
}

