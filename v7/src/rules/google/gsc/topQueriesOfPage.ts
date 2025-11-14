import type { Rule } from '@/core/types'

export const gscTopQueriesOfPageRule: Rule = {
  id: 'gsc:top-queries-of-page',
  name: 'GSC Top queries of page',
  enabled: false,
  async run(page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    if (!token) return { label: 'GSC', message: 'No Google token', type: 'info', name: "googleRule" }
    const site = String((vars as Record<string, unknown>)['gsc_site_url'] || '')
    if (!site) return { label: 'GSC', message: 'Set variables.gsc_site_url', type: 'info', name: "googleRule" }
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['query','page'], dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] }], rowLimit: 5 }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: "googleRule" }
    const j = await r.json() as { rows?: Array<{ keys?: string[], clicks?: number, impressions?: number }> }
    const rows = (j.rows || []).map(r => `${(r.keys||[])[0]||''} (${r.impressions||0})`).join(', ')
    return { label: 'GSC', message: `Top queries: ${rows || 'none'}`, type: 'info', name: "googleRule", details: { url: page.url, site, topQueries: j.rows, apiResponse: j } }
  },
}

