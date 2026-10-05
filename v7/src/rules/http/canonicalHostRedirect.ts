import { navigationPathSteps } from './navigationPathSteps'
import { combineInputs, httpUrlField, navigationStepEvidence } from './navigationStepEvidence'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders } from '@/shared/http-utils'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { urlComparison } from '@/shared/presentation/comparison'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'

const NAME = 'WWW/Non-WWW Canonical Redirect'
const NOT_MARKUP = 'None - this rule checks recorded navigation events, not document markup'
const CHECKED = [
  textField('Hosts compared', 'First and final navigated hostnames, stripped of a leading www.'),
  textField('Required redirect', 'A single permanent 301/308 server redirect preserving path and query'),
  textField('Criterion', 'A host change between www and non-www is a single permanent server redirect'),
]
const CANONICAL_CHECKED = [textField('Selector', 'link[rel~="canonical" i]'), textField('Selection', 'First match; queried only when the host did not change')]
const CANONICAL_NOT_RETAINED = 'Canonical link element read for its href only; complete original markup not retained'

const stripWww = (host: string): string => host.toLowerCase().replace(/^www\./, '')
const isWwwHost = (host: string): boolean => host.toLowerCase().startsWith('www.')
const parseUrlSafe = (url: string): URL | null => { try { return new URL(url) } catch { return null } }
const samePathQuery = (a: URL, b: URL): boolean => a.pathname === b.pathname && a.search === b.search
const getCanonical = (pageUrl: string, doc: Document): URL | null => {
  const href = (doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href') || '').trim()
  return href ? parseUrlSafe(new URL(href, pageUrl).toString()) : null
}

export const canonicalHostRedirectRule: Rule = {
  id: 'http:canonical-host-redirect', name: NAME, presentation: 1, enabled: true, what: 'http',
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
    const build = (type: Result['type'], priority: number, input: string, values: DisplayField[], detailValues: DisplayField[] = [], evidence: ReturnType<typeof navigationStepEvidence> = []) => {
      const readDom = input.includes('Static DOM')
      return presentResult(canonicalHostRedirectRule, page, { input, type, priority, values, detailValues, evidence,
        checked: readDom ? [...CHECKED, ...CANONICAL_CHECKED] : CHECKED, noMarkup: readDom ? CANONICAL_NOT_RETAINED : NOT_MARKUP })
    }

    if (!hasHeaders(page.headers)) return build('runtime_error', 50, 'Not captured', [textField('HTTP response headers', 'Not captured')])

    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return build('info', 900, 'Not captured', [textField('Navigation events', 'Not captured')])
    }

    const { trace } = ledgerResult.data
    const steps = navigationPathSteps(page, trace)
    const evidence = navigationStepEvidence(steps, page.headerChain)
    const navInput = combineInputs('Navigation events', (page.headerChain?.length ?? 0) > 0 && 'Main-document HTTP response')
    const firstUrl = trace[0]?.url || page.firstUrl || page.url
    const finalUrl = trace[trace.length - 1]?.url || page.lastUrl || page.url
    const first = parseUrlSafe(firstUrl)
    const final = parseUrlSafe(finalUrl)
    const urls = [httpUrlField('First URL', firstUrl), httpUrlField('Final URL', finalUrl)]
    // Overview: both navigated URLs, the decisive redirect fact, then the Comparison row (FORMATTING.md F1, F2).
    const overview = (fact: DisplayField, comparison = urlComparison(firstUrl, finalUrl, 'final URL')) => [...urls, fact, textField('Comparison', comparison)]

    if (!first || !final) {
      return build('warn', 200, navInput, [...urls, textField('Comparison', 'Not comparable, invalid URL')], [], evidence)
    }

    const sameBase = stripWww(first.hostname) === stripWww(final.hostname)
    const wwwDiff = isWwwHost(first.hostname) !== isWwwHost(final.hostname)
    const httpRedirects = trace.filter((t) => t.type === 'http_redirect')
    const clientRedirects = trace.filter((t) => t.type === 'client_redirect')

    if (sameBase && wwwDiff) {
      if (clientRedirects.length > 0) {
        return build('error', 100, navInput, overview(textField('Client-side redirects', clientRedirects.length)), [], evidence)
      }
      if (httpRedirects.length === 0) {
        return build('warn', 200, navInput, overview(textField('Server redirects', 0)), [], evidence)
      }
      const statuses = httpRedirects.map((t) => t.statusCode)
      const permanent = statuses.every((status) => status === 301 || status === 308)
      if (!permanent) {
        return build('error', 130, navInput, overview(textField('Redirect status', httpStatusLabel(statuses.find((s) => s !== 301 && s !== 308)))), [], evidence)
      }
      if (!samePathQuery(first, final)) {
        return build('error', 140, navInput, overview(textField('Path and query', 'Changed')), [], evidence)
      }
      if (httpRedirects.length > 1) {
        return build('warn', 220, navInput, overview(textField('Redirect hops', httpRedirects.length)), [], evidence)
      }
      return build('ok', 850, navInput, overview(textField('Redirect status', httpStatusLabel(statuses[0]))), [], evidence)
    }

    const canonical = getCanonical(page.url, page.doc)
    const input = combineInputs(navInput, 'Static DOM')
    if (canonical && stripWww(canonical.hostname) === stripWww(final.hostname) && isWwwHost(canonical.hostname) !== isWwwHost(final.hostname) && samePathQuery(canonical, final)) {
      return build('warn', 250, input, overview(httpUrlField('Canonical URL', canonical.toString()), urlComparison(finalUrl, canonical.toString(), 'canonical URL')), [], evidence)
    }
    return build('info', 800, input, overview(textField('Server redirects', httpRedirects.length)), [], evidence)
  },
}
