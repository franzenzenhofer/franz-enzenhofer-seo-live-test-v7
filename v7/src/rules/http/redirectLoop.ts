import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { redirectChainDetails } from '@/shared/redirectChainFormat'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'

const LABEL = 'HTTP'
const NAME = 'Redirect Loop Detection'
const RULE_ID = 'http:redirect-loop'

export const redirectLoopRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'standard',
    references: [
      'https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx',
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
    ],
    description:
      'Detects redirect loops by flagging any URL that appears more than once in the recorded navigation redirect trace.',
  },

  async run(page, ctx): Promise<Result> {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)

    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No navigation data available for loop detection.',
        type: 'info',
        priority: 900,
        details: {},
      }
    }

    const { trace } = ledgerResult.data
    // Full hop-by-hop main-document chain (URL, status, Location) from webRequest.
    const chainDetails = redirectChainDetails(headerChainToRedirectChain(page.headerChain, page.status))

    // Filter to only actual redirects (not 'load' or 'history_api')
    const redirectTrace = trace.filter((hop) => hop.type === 'http_redirect' || hop.type === 'client_redirect')

    if (redirectTrace.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No redirects detected (direct load).',
        type: 'ok',
        priority: 800,
        details: {
          trace,
          ...chainDetails,
          redirectCount: 0,
        },
      }
    }

    const urls = redirectTrace.map((hop) => hop.url)
    const urlCounts = new Map<string, number>()

    for (const url of urls) {
      urlCounts.set(url, (urlCounts.get(url) || 0) + 1)
    }

    const loopUrls = Array.from(urlCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([url, count]) => ({ url, count }))

    if (loopUrls.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: `No redirect loops detected (${redirectTrace.length} redirect${redirectTrace.length > 1 ? 's' : ''} checked).`,
        type: 'ok',
        priority: 800,
        details: {
          trace,
          ...chainDetails,
          redirectCount: redirectTrace.length,
          uniqueUrlCount: urlCounts.size,
        },
      }
    }

    const loopDesc = loopUrls.map((l) => `  ${l.url} (visited ${l.count} times)`).join('\n')
    const firstLoop = loopUrls[0]
    const message =
      loopUrls.length === 1 && firstLoop
        ? `Redirect loop detected!\n\n${loopDesc}\n\nThe same URL appears ${firstLoop.count} times in the redirect chain.`
        : `Redirect loops detected (${loopUrls.length} URLs)!\n\n${loopDesc}`

    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'error',
      priority: 50,
      details: {
        trace,
        ...chainDetails,
        loopUrls,
      },
    }
  },
}
