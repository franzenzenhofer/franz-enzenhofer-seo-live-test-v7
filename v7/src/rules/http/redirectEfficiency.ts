import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { redirectChainDetails } from '@/shared/redirectChainFormat'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'

const LABEL = 'HTTP'
const NAME = 'Redirect Efficiency Score'
const RULE_ID = 'http:redirect-efficiency'

export const redirectEfficiencyRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'general',
    references: [
      'https://developer.chrome.com/docs/lighthouse/performance/redirects',
      'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
    ],
    description:
      'Reports the observed redirect chain facts (hop count, client-side redirects, temporary-status hops) and warns when the chain has 2 or more redirect hops.',
  },

  async run(page, ctx): Promise<Result> {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)

    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No navigation data available for redirect analysis.',
        type: 'info',
        priority: 900,
        details: {},
      }
    }

    const { trace } = ledgerResult.data
    // Full hop-by-hop main-document chain (URL, status, Location) from webRequest.
    const chainDetails = redirectChainDetails(headerChainToRedirectChain(page.headerChain, page.status))
    const totalHops = trace.length
    const redirects = trace.filter((h) => h.type === 'http_redirect' || h.type === 'client_redirect')
    const httpRedirects = redirects.filter((h) => h.type === 'http_redirect')
    const clientRedirects = redirects.filter((h) => h.type === 'client_redirect')
    const tempRedirects = httpRedirects.filter((h) => h.statusCode === 302 || h.statusCode === 303 || h.statusCode === 307)
    const permRedirects = httpRedirects.filter((h) => h.statusCode === 301 || h.statusCode === 308)

    if (redirects.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Direct load with no redirects - the page loaded without any intermediate hops.',
        type: 'ok',
        priority: 900,
        details: { ...chainDetails, totalHops, redirects: 0, httpRedirects: 0, clientRedirects: 0 },
      }
    }

    const facts = [
      `HTTP redirects: ${httpRedirects.length} (${permRedirects.length} permanent, ${tempRedirects.length} temporary)`,
      `Client-side redirects: ${clientRedirects.length}`,
      `Total hops: ${totalHops}`,
    ].join('\n')

    const hopWord = `redirect hop${redirects.length > 1 ? 's' : ''}`
    const isChain = redirects.length >= 2

    return {
      label: LABEL,
      name: NAME,
      message: isChain
        ? `Redirect chain: ${redirects.length} ${hopWord} - each redirect adds latency before the page can load.\n\n${facts}`
        : `${redirects.length} ${hopWord} observed.\n\n${facts}`,
      type: isChain ? 'warn' : 'ok',
      priority: isChain ? 200 : 800,
      details: {
        trace,
        ...chainDetails,
        totalHops,
        redirects: redirects.length,
        httpRedirects: httpRedirects.length,
        clientRedirects: clientRedirects.length,
        permanentRedirects: permRedirects.length,
        temporaryRedirects: tempRedirects.length,
      },
    }
  },
}
