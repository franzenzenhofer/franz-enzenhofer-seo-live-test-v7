import parse from 'simple-functional-robots-txt-parser'

import type { Rule } from '@/core/types'

const sameHost = (a: string, b: string) => { try { return new URL(a).host === new URL(b).host } catch { return false } }

export const robotsBlockedResourcesRule: Rule = {
  id: 'robots:blocked-resources',
  name: 'robots.txt blocked resources',
  enabled: true,
  async run(page) {
    const list = page.resources || []
    if (!list.length) return { label: 'ROBOTS', message: 'No resource requests captured', type: 'info' }
    const base = new URL(page.url)
    const r = (await fetch(`${base.origin}/robots.txt`).catch(()=> null)) as Response | null
    if (!r || !r.ok) return { label: 'ROBOTS', message: 'robots.txt not reachable for blocked check', type: 'info' }
    const txt = await r.text()
    const ua = 'Googlebot'
    let blocked = 0
    for (const u of list) {
      if (!sameHost(page.url, u)) continue
      const res = parse(txt, u, ua) as Record<string, unknown>
      const allowed = Boolean(res['allowed'])
      const disallowed = Boolean(res['disallowed'])
      if (!allowed || disallowed) blocked++
    }
    return blocked ? { label: 'ROBOTS', message: `${blocked} resources disallowed by robots.txt`, type: 'warn' } : { label: 'ROBOTS', message: 'No blocked resources', type: 'ok' }
  },
}
