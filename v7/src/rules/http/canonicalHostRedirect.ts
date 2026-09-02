import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { redirectChainDetails } from '@/shared/redirectChainFormat'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'

const LABEL = 'HTTP'
const NAME = 'WWW/Non-WWW Canonical Redirect'
const RULE_ID = 'http:canonical-host-redirect'

const stripWww = (host: string): string => host.toLowerCase().replace(/^www\./, '')
const isWwwHost = (host: string): boolean => host.toLowerCase().startsWith('www.')

const parseUrlSafe = (url: string): URL | null => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

const samePathQuery = (a: URL, b: URL): boolean => a.pathname === b.pathname && a.search === b.search

const buildResult = (message: string, type: Result['type'], priority: number, details: Record<string, unknown>): Result => ({
  label: LABEL,
  name: NAME,
  message,
  type,
  priority,
  details,
})

type Chained = Record<string, unknown>
const withChain = (chain: Chained) => (details: Chained): Chained => ({ ...chain, ...details })

const getCanonical = (pageUrl: string, doc: Document): URL | null => {
  const href = (doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href') || '').trim()
  if (!href) return null
  return parseUrlSafe(new URL(href, pageUrl).toString())
}

export const canonicalHostRedirectRule: Rule = {
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
    description: 'Evaluates www/non-www host canonicalization from the observed navigation: expects a permanent (301/308) server redirect preserving path+query; errors on client-side and temporary redirects, warns on multi-hop chains and canonical-only host resolution.',
  },

  async run(page, ctx): Promise<Result> {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)

    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    // Full hop-by-hop main-document chain (URL, status, Location) from webRequest.
    const chained = withChain(redirectChainDetails(headerChainToRedirectChain(page.headerChain, page.status)))
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return buildResult('No navigation data available to evaluate host canonicalization.', 'info', 900, chained({}))
    }

    const trace = ledgerResult.data.trace
    const firstUrl = trace[0]?.url || page.firstUrl || page.url
    const finalUrl = trace[trace.length - 1]?.url || page.lastUrl || page.url

    const first = parseUrlSafe(firstUrl)
    const final = parseUrlSafe(finalUrl)
    if (!first || !final) {
      return buildResult('Invalid URL detected; cannot evaluate www/non-www redirect behavior.', 'warn', 200, chained({ firstUrl, finalUrl }))
    }

    const sameBase = stripWww(first.hostname) === stripWww(final.hostname)
    const wwwDiff = isWwwHost(first.hostname) !== isWwwHost(final.hostname)

    const httpRedirects = trace.filter((t) => t.type === 'http_redirect')
    const clientRedirects = trace.filter((t) => t.type === 'client_redirect')

    if (sameBase && wwwDiff) {
      if (clientRedirects.length > 0) {
        return buildResult(
          'Client-side redirect detected for www/non-www canonicalization. Use a single 301/308 server redirect.',
          'error',
          100,
          chained({ firstUrl, finalUrl, trace, clientRedirects: clientRedirects.length }),
        )
      }

      if (httpRedirects.length === 0) {
        return buildResult('Host changed between www and non-www without an observed server redirect.', 'warn', 200, chained({ firstUrl, finalUrl, trace }))
      }

      const statuses = httpRedirects.map((t) => t.statusCode)
      const permanent = statuses.every((status) => status === 301 || status === 308)
      if (!permanent) {
        return buildResult(
          `Temporary redirect (${statuses.find((s) => s !== 301 && s !== 308) || 'unknown'}) detected. Use permanent 301/308 redirects between www and non-www.`,
          'error',
          130,
          chained({ firstUrl, finalUrl, statuses, trace }),
        )
      }

      if (!samePathQuery(first, final)) {
        return buildResult('www/non-www redirect changed the path or query. Preserve the exact path and query parameters.', 'error', 140, chained({ firstUrl, finalUrl, trace }))
      }

      // Google follows up to 10 hops and every permanent hop still carries the
      // canonical signal; a chain is a crawl-efficiency issue, not an error.
      if (httpRedirects.length > 1) {
        return buildResult(`Permanent redirect chain with ${httpRedirects.length} hops for www/non-www canonicalization; a single hop is more efficient.`, 'warn', 220, chained({ firstUrl, finalUrl, statuses, trace, httpRedirects: httpRedirects.length }))
      }

      return buildResult('Single-hop permanent redirect between www and non-www detected.', 'ok', 850, chained({ firstUrl, finalUrl, status: statuses[0], trace }))
    }

    const canonical = getCanonical(page.url, page.doc)
    if (canonical && stripWww(canonical.hostname) === stripWww(final.hostname) && isWwwHost(canonical.hostname) !== isWwwHost(final.hostname) && samePathQuery(canonical, final)) {
      // rel=canonical is a supported consolidation signal on its own; a
      // permanent redirect is simply the stronger one.
      return buildResult(
        'Canonical points to the alternate host but no redirect occurred. A 301/308 redirect is the stronger canonicalization signal.',
        'warn',
        250,
        chained({ firstUrl, finalUrl, canonicalUrl: canonical.toString(), trace }),
      )
    }

    return buildResult(
      'No www/non-www redirect observed (current host assumed canonical). Ensure the alternate host redirects in a single permanent hop.',
      'ok',
      800,
      chained({ firstUrl, finalUrl, trace, httpRedirects: httpRedirects.length }),
    )
  },
}
