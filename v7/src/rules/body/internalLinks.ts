import type { Rule } from '@/core/types'

const sameHost = (base: string, href: string) => {
  try { const b = new URL(base); const u = new URL(href, base); return b.host === u.host } catch { return false }
}

export const internalLinksRule: Rule = {
  id: 'body:internal-links',
  name: 'Internal links count',
  enabled: true,
  async run(page) {
    const a = Array.from(page.doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
    let internal = 0; let external = 0
    for (const x of a) {
      if (sameHost(page.url, x.getAttribute('href') || '')) internal++
      else external++
    }
    return { label: 'BODY', message: `Links: internal ${internal}, external ${external}`, type: 'info' }
  },
}
