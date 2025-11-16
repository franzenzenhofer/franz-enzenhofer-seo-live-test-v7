import type { Rule } from '@/core/types'

export const gscPageWorldwideRule: Rule = {
  id: 'gsc:page-worldwide',
  name: 'GSC page worldwide analytics',
  enabled: true,
  what: 'gsc',
  async run(page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    if (!token) return { label: 'GSC', message: 'Google Search Console not authenticated. Sign in with Google in settings.', type: 'runtime_error', name: "googleRule", priority: -1000 }
    const site = String((vars as Record<string, unknown>)['gsc_site_url'] || '')
    if (!site) return { label: 'GSC', message: 'GSC site URL not configured. Set gsc_site_url in settings.', type: 'runtime_error', name: "googleRule", priority: -1000 }
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['page'] }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: "googleRule" }
    const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number, keys?: string[] }> }
    const row = (j.rows || []).find(r => (r.keys||[])[0] === page.url)
    const imp = row?.impressions || 0
    const cl = row?.clicks || 0
    return { label: 'GSC', message: `Impressions ${imp}, Clicks ${cl}`, type: 'info', name: "googleRule", details: { url: page.url, site, impressions: imp, clicks: cl, apiResponse: j } }
  },
}

