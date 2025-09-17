import type { Rule } from '@/core/types'

export const canonicalChainRule: Rule = {
  id: 'head:canonical-chain',
  name: 'Canonical redirect chain',
  enabled: true,
  async run(page) {
    const href = page.doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    if (!href) return { label: 'HEAD', message: 'No canonical link', type: 'info' }
    const abs = new URL(href, page.url).toString()
    let url = abs; let hops = 0
    for (let i=0;i<5;i++) {
      const r = await fetch(url, { method: 'HEAD', redirect: 'manual' })
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location'); if (!loc) break
        url = new URL(loc, url).toString(); hops++
      } else break
    }
    return hops>0 ? { label: 'HEAD', message: `Canonical chain length ${hops}`, type: hops>3 ? 'error' : 'warn' } : { label: 'HEAD', message: 'Canonical no redirects', type: 'ok' }
  },
}

