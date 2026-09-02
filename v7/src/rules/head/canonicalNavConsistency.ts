import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl } from '@/shared/url-utils'
import { redirectChainDetails } from '@/shared/redirectChainFormat'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'

const LABEL = 'HEAD'
const NAME = 'Canonical vs navigation'
const RULE_ID = 'head:canonical-nav-consistency'

type NavHop = { url?: string; type?: string }
type NavLedger = { trace: NavHop[] }

const getLedger = (ctx: { globals: Record<string, unknown> }): NavLedger | null => {
  const raw = ctx.globals['navigationLedger']
  if (!raw || typeof raw !== 'object') return null
  const trace = Array.isArray((raw as NavLedger).trace) ? (raw as NavLedger).trace : []
  return trace.length ? { trace } : null
}

export const canonicalNavConsistencyRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
    ],
    description: 'Compares the canonical URL to the observed navigation/redirect chain: warns when the canonical equals a URL that redirected, informs when the canonical points elsewhere.',
  },
  async run(page, ctx) {
    const el = page.doc.querySelector('link[rel~="canonical" i]')
    const href = (el?.getAttribute('href') || '').trim()
    const domPath = getDomPath(el)
    if (!href) {
      return { label: LABEL, name: NAME, message: 'No canonical link to compare against navigation chain.', type: 'info', priority: 900, details: { domPath: domPath || undefined } }
    }
    let canonicalResolved = ''
    try {
      canonicalResolved = new URL(href, page.url).toString()
    } catch {
      return { label: LABEL, name: NAME, message: 'Canonical URL invalid; cannot compare to navigation.', type: 'warn', priority: 200, details: { canonicalUrl: href, domPath } }
    }

    // Full hop-by-hop main-document chain (URL, status, Location) from webRequest.
    const chainDetails = redirectChainDetails(headerChainToRedirectChain(page.headerChain, page.status))
    const ledger = getLedger(ctx)
    const trace = ledger?.trace || []
    const firstUrl = trace[0]?.url || page.firstUrl || page.url
    const finalUrl = trace[trace.length - 1]?.url || page.lastUrl || page.url
    const redirectCount = trace.filter((t) => t.type === 'http_redirect' || t.type === 'client_redirect').length

    const normCanonical = normalizeUrl(canonicalResolved)
    const normFinal = normalizeUrl(finalUrl || '')
    const normFirst = normalizeUrl(firstUrl || '')

    if (!redirectCount && normCanonical === normFinal) {
      return { label: LABEL, name: NAME, message: 'Canonical aligns with final URL.', type: 'ok', priority: 850, details: { canonicalUrl: canonicalResolved, finalUrl, ...chainDetails, domPath } }
    }

    if (redirectCount > 0 && normCanonical === normFirst && normFinal !== normCanonical) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Canonical points to a URL that redirects; update canonical to the final landing URL.',
        type: 'warn',
        priority: 180,
        details: { canonicalUrl: canonicalResolved, finalUrl, redirectCount, trace, ...chainDetails, domPath },
      }
    }

    // A canonical pointing to a different preferred URL is the documented use
    // case of rel=canonical, not a conflicting signal - report it as info.
    if (normCanonical !== normFinal) {
      return {
        label: LABEL,
        name: NAME,
        message: `Canonical URL (${canonicalResolved}) points to a different URL than the final landing URL (${finalUrl}).`,
        type: 'info',
        priority: 600,
        details: { canonicalUrl: canonicalResolved, finalUrl, redirectCount, trace, ...chainDetails, domPath },
      }
    }

    return { label: LABEL, name: NAME, message: 'Canonical aligns with navigation.', type: 'ok', priority: 800, details: { canonicalUrl: canonicalResolved, finalUrl, redirectCount, ...chainDetails, domPath } }
  },
}
