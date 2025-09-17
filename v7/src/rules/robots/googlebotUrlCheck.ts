import parse from 'simple-functional-robots-txt-parser'

import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

export const googlebotUrlCheckRule: Rule = {
  id: 'robots:googlebot-url-check',
  name: 'Googlebot URL allowed',
  enabled: true,
  async run(page) {
    let origin = ''
    try { origin = new URL(page.url).origin } catch { return { label: 'ROBOTS', message: 'Invalid URL', type: 'info' } }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt) return { label: 'ROBOTS', message: 'robots.txt not reachable', type: 'info' }
    const res = parse(txt, page.url, 'Googlebot') as Record<string, unknown>
    const allowed = Boolean(res['allowed'])
    return allowed ? { label: 'ROBOTS', message: 'Googlebot is allowed', type: 'ok' } : { label: 'ROBOTS', message: 'Googlebot is disallowed', type: 'warn' }
  },
}
