import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

export const robotsSitemapReferenceRule: Rule = {
  id: 'robots:sitemap-reference',
  name: 'robots.txt Sitemap reference',
  enabled: true,
  async run(page) {
    let origin = ''
    try { origin = new URL(page.url).origin } catch { return { label: 'ROBOTS', message: 'Invalid URL', type: 'info' } }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt) return { label: 'ROBOTS', message: 'robots.txt not reachable', type: 'info' }
    const has = /\n\s*sitemap\s*:\s*\S+/i.test(`\n${txt}`)
    return has ? { label: 'ROBOTS', message: 'Sitemap reference present', type: 'ok' } : { label: 'ROBOTS', message: 'No Sitemap reference', type: 'warn' }
  },
}

