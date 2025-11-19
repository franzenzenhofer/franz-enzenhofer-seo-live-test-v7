import { HTTP_STATUS } from '@/shared/http-constants'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const LABEL = 'HEAD'
const NAME = 'Canonical Redirect Chain'
const RULE_ID = 'head:canonical-chain'
const SELECTOR = 'head > link[rel="canonical"]'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalChainRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector(SELECTOR)
    const href = linkEl?.getAttribute('href')?.trim() || ''
    const hasCanonical = Boolean(linkEl)
    const hasHref = Boolean(href)
    if (!hasCanonical || !hasHref) {
      return {
        name: NAME,
        label: LABEL,
        message: 'No canonical link found.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }
    const sourceHtml = extractHtml(linkEl)
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
    const message = hasChain
      ? `Canonical redirects ${hops} time${hops > 1 ? 's' : ''}: ${abs} → ${url}`
      : `Canonical URL has no redirects: ${abs}`
    return {
      name: NAME,
      label: LABEL,
      message,
      type: hasChain ? (hops > 3 ? 'error' : 'warn') : 'ok',
      priority: hasChain ? (hops > 3 ? 50 : 150) : 800,
      details: {
        sourceHtml,
        snippet: extractSnippet(href),
        domPath: getDomPath(linkEl),
        href,
        canonicalUrl: abs,
        finalUrl: url,
        hops,
        hasChain,
        reference: SPEC,
      },
    }
  },
}

