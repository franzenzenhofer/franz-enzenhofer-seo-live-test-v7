import type { Rule } from '@/core/types'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: 'GSC webproperty available',
  enabled: false,
  what: 'gsc',
  async run(page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null
    if (!token) return { label: 'GSC', message: 'Google Search Console not authenticated. Sign in with Google in settings.', type: 'runtime_error', name: "googleRule", priority: -1000 }
    const origin = new URL(page.url).origin
    const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return { label: 'GSC', message: `GSC error ${r.status}`, type: 'warn', name: "googleRule" }
    const j = await r.json() as { siteEntry?: Array<{ siteUrl?: string }> }
    const ok = (j.siteEntry || []).some(s => (s.siteUrl || '').includes(origin))
    return ok ? { label: 'GSC', message: 'Property available', type: 'ok', name: "googleRule", details: { url: page.url, origin, properties: j.siteEntry } } : { label: 'GSC', message: 'Property not available', type: 'warn', name: "googleRule", details: { url: page.url, origin, properties: j.siteEntry } }
  },
}

