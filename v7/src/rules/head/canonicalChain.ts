import { HTTP_STATUS } from '@/shared/http-constants'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

export const canonicalChainRule: Rule = {
  id: 'head:canonical-chain',
  name: 'Canonical redirect chain',
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel="canonical"]')
    const href = linkEl?.getAttribute('href') || ''
    if (!href)
      return { name: 'Canonical redirect chain', label: 'HEAD', message: 'No canonical link', type: 'info' }
    const sourceHtml = linkEl ? extractHtml(linkEl) : ''
    const abs = new URL(href, page.url).toString()
    let url = abs
    let hops = 0
    for (let i = 0; i < 5; i++) {
      const r = await fetch(url, { method: 'HEAD', redirect: 'manual' })
      if (r.status >= HTTP_STATUS.REDIRECT_MIN && r.status < HTTP_STATUS.REDIRECT_MAX) {
        const loc = r.headers.get('location')
        if (!loc) break
        url = new URL(loc, url).toString()
        hops++
      } else break
    }
    const hasChain = hops > 0
    return {
      name: 'Canonical redirect chain',
      label: 'HEAD',
      message: hasChain ? `Canonical chain length ${hops}` : 'Canonical no redirects',
      type: hasChain ? (hops > 3 ? 'error' : 'warn') : 'ok',
      details: linkEl
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(linkEl),
          }
        : undefined,
    }
  },
}

