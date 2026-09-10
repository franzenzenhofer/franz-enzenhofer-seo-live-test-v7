import { navigationPathSteps } from './navigationPathSteps'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { navigationOutcome, readNavigationSteps } from '@/shared/navigationSteps'

const LABEL = 'HTTP'
const NAME = 'Navigation Path Analysis'
const RULE_ID = 'http:navigation-path'

const buildResult = (
  message: string,
  type: Result['type'],
  priority: number,
  details: Record<string, unknown>,
): Result => ({ label: LABEL, name: NAME, message: [message, navigationOutcome(readNavigationSteps(details['navigationSteps']))].filter(Boolean).join(' '), type, priority, details })

export const navigationPathRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
      'https://developer.chrome.com/docs/lighthouse/performance/redirects',
      'https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx',
    ],
    description:
      'Analyzes the full navigation path (loads, HTTP redirects, client redirects, history API) and grades it: direct load ok, client redirect error, chain >1 hop warn (Googlebot follows up to 10 hops), temporary redirect warn, single permanent HTTP -> HTTPS redirect ok, other single permanent redirect info.',
  },

  async run(page, ctx): Promise<Result> {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success) return buildResult('Navigation path data unavailable.', 'info', 900, {})

    const { trace } = ledgerResult.data
    if (trace.length === 0) return buildResult('No navigation events recorded.', 'info', 900, {})

    // Filter to only actual redirects (not 'load' or 'history_api')
    const navigationSteps = navigationPathSteps(page, trace)
    const redirects = navigationSteps.filter((hop) => hop.type === 'http_redirect' || hop.type === 'client_redirect')
    const redirectCount = redirects.length

    const hasTemporaryRedirect = redirects.some(
      (t) => t.statusCode === 302 || t.statusCode === 303 || t.statusCode === 307,
    )
    const hasClientRedirect = redirects.some((t) => t.type === 'client_redirect')
    const lastHop = navigationSteps[navigationSteps.length - 1]
    const hasMixedHttp =
      navigationSteps.some((t) => t.url.startsWith('http:')) && lastHop?.url.startsWith('https:') === true
    const tempRedirectCodes = redirects
      .filter((t) => t.statusCode === 302 || t.statusCode === 303 || t.statusCode === 307)
      .map((t) => t.statusCode)
    const uniqueTempCodes = [...new Set(tempRedirectCodes)]

    const lastResponse = navigationSteps.filter((hop) => hop.type !== 'history_api').at(-1)
    if ((lastResponse?.statusCode ?? 0) >= 400) {
      return buildResult('Navigation ends with a server error response.', 'error', 100, {
        navigationSteps, redirectCount, fix: 'Fix the destination response or point the redirect to a working page.',
      })
    }

    if (redirectCount === 0) {
      return buildResult(`Direct load (no redirects).`, 'ok', 800, { navigationSteps, redirectCount })
    }

    if (hasClientRedirect) {
      return buildResult(
        `Client-side redirect detected (${redirectCount} hop${redirectCount > 1 ? 's' : ''}).\nPage code adds an extra navigation before the destination is reached.`,
        'error',
        100,
        { navigationSteps, redirectCount, issue: 'client_redirect', fix: 'Replace the JavaScript or meta refresh redirect with a server redirect to the final destination.' },
      )
    }

    if (redirectCount > 1) {
      return buildResult(
        `Redirect chain (${redirectCount} hops) - Performance impact.`,
        'warn',
        200,
        { navigationSteps, redirectCount, issue: 'long_chain', fix: 'Point the starting URL directly at the final destination in one server redirect. Update internal links to use the final URL.' },
      )
    }

    if (hasTemporaryRedirect) {
      const codesStr = uniqueTempCodes.map(httpStatusLabel).join(', ')
      return buildResult(
        `Temporary redirect (${codesStr}) detected.\nUse HTTP 301 Moved Permanently or HTTP 308 Permanent Redirect when the move is permanent.`,
        'warn',
        200,
        { navigationSteps, redirectCount, issue: 'temp_redirect', tempRedirectCodes: uniqueTempCodes },
      )
    }

    if (hasMixedHttp && redirects.every((hop) => hop.statusCode === 301 || hop.statusCode === 308)) {
      return buildResult(
        `HTTP → HTTPS permanent redirect (${redirectCount} hop${redirectCount > 1 ? 's' : ''}) - recommended setup.`,
        'ok',
        750,
        { navigationSteps, redirectCount, issue: 'http_to_https_redirect' },
      )
    }

    if (!redirects.every((hop) => hop.statusCode === 301 || hop.statusCode === 308)) {
      return buildResult('Server redirect recorded; permanence could not be confirmed.', 'info', 700, { navigationSteps, redirectCount })
    }

    return buildResult(
      `Single permanent redirect (${redirectCount} hop).`,
      'info',
      700,
      { navigationSteps, redirectCount, recommendation: 'If the move is intentional, keep the permanent redirect. Update internal links to point directly to the destination.' },
    )
  },
}
