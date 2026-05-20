import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'WWW/Non-WWW Canonical Redirect'
const RULE_ID = 'http:canonical-host-redirect'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

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
  details: { ...details, reference: SPEC },
})

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

  async run(page, ctx): Promise<Result> {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)

    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return buildResult('No navigation data available to evaluate host canonicalization.', 'info', 900, {})
    }

    const trace = ledgerResult.data.trace
    const firstUrl = trace[0]?.url || page.firstUrl || page.url
    const finalUrl = trace[trace.length - 1]?.url || page.lastUrl || page.url

    const first = parseUrlSafe(firstUrl)
    const final = parseUrlSafe(finalUrl)
    if (!first || !final) {
      return buildResult('Invalid URL detected; cannot evaluate www/non-www redirect behavior.', 'warn', 200, { firstUrl, finalUrl })
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
          { firstUrl, finalUrl, trace, clientRedirects: clientRedirects.length },
        )
      }

      if (httpRedirects.length !== 1) {
        return buildResult(
          `Expected a single server redirect for www/non-www canonicalization, found ${httpRedirects.length}.`,
          'error',
          120,
          { firstUrl, finalUrl, trace, httpRedirects: httpRedirects.length },
        )
      }

      const status = httpRedirects[0]?.statusCode
      const isPermanent = status === 301 || status === 308
      const pathMatch = samePathQuery(first, final)

      if (!isPermanent) {
        return buildResult(
          `Temporary redirect (${status || 'unknown'}) detected. Use a single permanent 301/308 redirect between www and non-www.`,
          'error',
          130,
          { firstUrl, finalUrl, status, trace },
        )
      }

      if (!pathMatch) {
        return buildResult(
          'www/non-www redirect changed the path or query. Preserve the exact path and query parameters.',
          'error',
          140,
          { firstUrl, finalUrl, trace },
        )
      }

      return buildResult(
        'Single-hop permanent redirect between www and non-www detected.',
        'ok',
        850,
        { firstUrl, finalUrl, status, trace },
      )
    }

    const canonical = getCanonical(page.url, page.doc)
    if (canonical) {
      const canonicalSameBase = stripWww(canonical.hostname) === stripWww(final.hostname)
      const canonicalWwwDiff = isWwwHost(canonical.hostname) !== isWwwHost(final.hostname)
      const canonicalPathMatch = samePathQuery(canonical, final)

      if (canonicalSameBase && canonicalWwwDiff && canonicalPathMatch) {
        return buildResult(
          'Canonical points to the alternate host but no redirect occurred. Use a single 301/308 redirect instead of canonical-only resolution.',
          'error',
          110,
          { finalUrl, canonicalUrl: canonical.toString() },
        )
      }
    }

    return buildResult(
      'No www/non-www redirect observed (current host assumed canonical). Ensure the alternate host redirects in a single permanent hop.',
      'ok',
      800,
      { firstUrl, finalUrl, trace, httpRedirects: httpRedirects.length },
    )
  },
}
