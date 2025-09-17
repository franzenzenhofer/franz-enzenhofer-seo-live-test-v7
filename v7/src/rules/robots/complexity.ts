import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

export const robotsComplexityRule: Rule = {
  id: 'robots:complexity',
  name: 'robots.txt complexity',
  enabled: true,
  async run(page) {
    let origin = ''
    try { origin = new URL(page.url).origin } catch { return { label: 'ROBOTS', message: 'Invalid URL', type: 'info' } }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt) return { label: 'ROBOTS', message: 'robots.txt not reachable', type: 'info' }
    const lines = txt.split(/\r?\n/)
    const dis = lines.filter(l => /^\s*disallow\s*:/i.test(l)).length
    const al = lines.filter(l => /^\s*allow\s*:/i.test(l)).length
    const sa = lines.filter(l => /^\s*sitemap\s*:/i.test(l)).length
    return { label: 'ROBOTS', message: `Rules: Disallow ${dis}, Allow ${al}, Sitemaps ${sa}`, type: 'info' }
  },
}

