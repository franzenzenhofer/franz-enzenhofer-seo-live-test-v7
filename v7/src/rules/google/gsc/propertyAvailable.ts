import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'

import type { Rule } from '@/core/types'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: 'GSC webproperty available',
  enabled: true,
  what: 'gsc',
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()
    const origin = new URL(page.url).origin
    try {
      const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) {
        return { label: 'GSC', message: `GSC error ${r.status}`, type: 'warn', name: 'googleRule', details: { status: r.status, url: page.url } }
      }
      const j = (await r.json()) as { siteEntry?: Array<{ siteUrl?: string }> }
      const ok = (j.siteEntry || []).some((s) => (s.siteUrl || '').includes(origin))
      return ok
        ? { label: 'GSC', message: 'Property available', type: 'ok', name: 'googleRule', details: { url: page.url, origin, properties: j.siteEntry } }
        : { label: 'GSC', message: 'Property not available', type: 'warn', name: 'googleRule', details: { url: page.url, origin, properties: j.siteEntry } }
    } catch (error) {
      return { label: 'GSC', message: 'GSC sites lookup failed', type: 'runtime_error', name: 'googleRule', details: { error: error instanceof Error ? error.message : String(error), url: page.url } }
    }
  },
}
