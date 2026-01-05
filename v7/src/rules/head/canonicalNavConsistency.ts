import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl } from '@/shared/url-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical vs navigation'
const RULE_ID = 'head:canonical-nav-consistency'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

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
  async run(page, ctx) {
    const el = page.doc.querySelector('link[rel~="canonical" i]')
    const href = (el?.getAttribute('href') || '').trim()
    const domPath = getDomPath(el)
    if (!href) {
      return { label: LABEL, name: NAME, message: 'No canonical link to compare against navigation chain.', type: 'info', priority: 900, details: { reference: SPEC, domPath: domPath || undefined } }
    }
    let canonicalResolved = ''
    try {
      canonicalResolved = new URL(href, page.url).toString()
    } catch {
      return { label: LABEL, name: NAME, message: 'Canonical URL invalid; cannot compare to navigation.', type: 'warn', priority: 200, details: { canonicalUrl: href, reference: SPEC, domPath } }
    }

    const ledger = getLedger(ctx)
    const trace = ledger?.trace || []
    const firstUrl = trace[0]?.url || page.firstUrl || page.url
    const finalUrl = trace[trace.length - 1]?.url || page.lastUrl || page.url
    const redirectCount = trace.filter((t) => t.type === 'http_redirect' || t.type === 'client_redirect').length

    const normCanonical = normalizeUrl(canonicalResolved)
    const normFinal = normalizeUrl(finalUrl || '')
    const normFirst = normalizeUrl(firstUrl || '')

    if (!redirectCount && normCanonical === normFinal) {
      return { label: LABEL, name: NAME, message: 'Canonical aligns with final URL.', type: 'ok', priority: 850, details: { canonicalUrl: canonicalResolved, finalUrl, reference: SPEC, domPath } }
    }

    if (redirectCount > 0 && normCanonical === normFirst && normFinal !== normCanonical) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Canonical points to a URL that redirects; update canonical to the final landing URL.',
        type: 'warn',
        priority: 180,
        details: { canonicalUrl: canonicalResolved, finalUrl, redirectCount, trace, reference: SPEC, domPath },
      }
    }

    if (normCanonical !== normFinal) {
      return {
        label: LABEL,
        name: NAME,
        message: `Canonical URL (${canonicalResolved}) differs from final landing URL (${finalUrl}). Align them to avoid conflicting signals.`,
        type: 'warn',
        priority: 220,
        details: { canonicalUrl: canonicalResolved, finalUrl, redirectCount, trace, reference: SPEC, domPath },
      }
    }

    return { label: LABEL, name: NAME, message: 'Canonical aligns with navigation.', type: 'ok', priority: 800, details: { canonicalUrl: canonicalResolved, finalUrl, redirectCount, reference: SPEC, domPath } }
  },
}
