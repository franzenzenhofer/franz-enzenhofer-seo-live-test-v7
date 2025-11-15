import type { Rule } from '@/core/types'

const urlOf = (u: string) => {
  try {
    const o = new URL(u)
    if (o.protocol !== 'http:' && o.protocol !== 'https:') {
      console.error(`[robotsTxt] Invalid protocol blocked: ${o.protocol} from ${u}`)
      return ''
    }
    return `${o.origin}/robots.txt`
  } catch (e) {
    console.error(`[robotsTxt] Invalid URL: ${u}`, e)
    return ''
  }
}

export const robotsTxtRule: Rule = {
  id: 'robots-exists',
  name: 'robots.txt Exists',
  enabled: true,
  what: 'http',
  run: async (page) => {
    const rUrl = urlOf(page.url)
    if (!rUrl)
      return { label: 'ROBOTS', message: 'Invalid or unsupported URL', type: 'info', name: 'robotsTxt' }
    try {
      const r = await fetch(rUrl, { method: 'GET' })
      if (!r.ok)
        return {
          label: 'ROBOTS',
          message: `robots.txt not reachable (${r.status})`,
          type: 'warn',
          name: 'robotsTxt',
        }
      const body = await r.text()
      const hasSitemap = /\n\s*sitemap\s*:/i.test(`\n${body}`)
      return {
        label: 'ROBOTS',
        message: hasSitemap ? 'robots.txt with Sitemap' : 'robots.txt present',
        type: 'info',
        name: 'robotsTxt',
        details: { robotsTxt: body },
      }
    } catch (e) {
      return { label: 'ROBOTS', message: String(e), type: 'warn', name: 'robotsTxt' }
    }
  },
}
