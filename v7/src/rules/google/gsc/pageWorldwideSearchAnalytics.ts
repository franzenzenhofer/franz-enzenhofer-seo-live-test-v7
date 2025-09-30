import type { Rule } from '@/core/types'

export const gscPageWorldwideRule: Rule = {
  id: 'gsc:page-worldwide',
  name: 'GSC page worldwide analytics',
  enabled: false,
  async run(page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    if (!token) return { label: 'GSC', message: 'No Google token', type: 'info', name: '$(basename ${f%.ts})' }
    const site = String((vars as Record<string, unknown>)['gsc_site_url'] || '')
    if (!site) return { label: 'GSC', message: 'Set variables.gsc_site_url', type: 'info', name: '$(basename ${f%.ts})' }
    const body = { startDate: '2020-01-01', endDate: '2099-12-31', dimensions: ['page'] }
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'GSC', message: `GSC query error ${r.status}`, type: 'warn', name: '$(basename ${f%.ts})' }
    const j = await r.json() as { rows?: Array<{ clicks?: number, impressions?: number, keys?: string[] }> }
    const row = (j.rows || []).find(r => (r.keys||[])[0] === page.url)
    const imp = row?.impressions || 0
    const cl = row?.clicks || 0
    return { label: 'GSC', message: `Impressions ${imp}, Clicks ${cl}`, type: 'info', name: '$(basename ${f%.ts})' }
  },
}

