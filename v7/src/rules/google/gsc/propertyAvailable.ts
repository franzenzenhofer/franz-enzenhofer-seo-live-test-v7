import type { Rule } from '@/core/types'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: 'GSC webproperty available',
  enabled: false,
  async run(page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null
    if (!token) return { label: 'GSC', message: 'No Google token', type: 'info', name: '$(basename ${f%.ts})' }
    const origin = new URL(page.url).origin
    const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return { label: 'GSC', message: `GSC error ${r.status}`, type: 'warn', name: '$(basename ${f%.ts})' }
    const j = await r.json() as { siteEntry?: Array<{ siteUrl?: string }> }
    const ok = (j.siteEntry || []).some(s => (s.siteUrl || '').includes(origin))
    return ok ? { label: 'GSC', message: 'Property available', type: 'ok', name: '$(basename ${f%.ts})' } : { label: 'GSC', message: 'Property not available', type: 'warn', name: '$(basename ${f%.ts})' }
  },
}

