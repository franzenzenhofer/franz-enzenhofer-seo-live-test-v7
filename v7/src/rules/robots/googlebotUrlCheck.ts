import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

export const googlebotUrlCheckRule: Rule = {
  id: 'robots:googlebot-url-check',
  name: 'Googlebot URL allowed',
  enabled: true,
  what: 'http',
  async run(page) {
    let origin = ''
    try {
      origin = new URL(page.url).origin
    } catch {
      return { label: 'ROBOTS', message: 'Invalid URL', type: 'info', name: 'googlebotUrlCheck' }
    }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt)
      return {
        label: 'ROBOTS',
        message: 'robots.txt not reachable',
        type: 'info',
        name: 'googlebotUrlCheck',
      }
    const res = parse(txt, page.url, 'Googlebot') as Record<string, unknown>
    const allowed = Boolean(res['allowed'])
    return {
      label: 'ROBOTS',
      message: allowed ? 'Googlebot is allowed' : 'Googlebot is disallowed',
      type: allowed ? 'ok' : 'warn',
      name: 'googlebotUrlCheck',
      details: { robotsTxt: txt },
    }
  },
}
