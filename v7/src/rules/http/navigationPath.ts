import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Navigation Path Analysis'
const RULE_ID = 'http:navigation-path'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections'

const buildResult = (
  message: string,
  type: Result['type'],
  priority: number,
  details: Record<string, unknown>,
): Result => ({ label: LABEL, name: NAME, message, type, priority, details: { ...details, reference: SPEC } })

export const navigationPathRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',

  async run(page, ctx): Promise<Result> {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success) return buildResult('Navigation path data unavailable.', 'info', 900, {})

    const { trace } = ledgerResult.data
    if (trace.length === 0) return buildResult('No navigation events recorded.', 'info', 900, {})

    // Filter to only actual redirects (not 'load' or 'history_api')
    const redirects = trace.filter((hop) => hop.type === 'http_redirect' || hop.type === 'client_redirect')
    const redirectCount = redirects.length

    const steps = trace.map((hop, i) => {
      let label = 'Unknown'
      if (hop.type === 'http_redirect') {
        label = `HTTP ${hop.statusCode || '3xx'} Redirect`
      } else if (hop.type === 'client_redirect') {
        label = 'Client-Side Redirect (JS/Meta Refresh)'
      } else if (hop.type === 'history_api') {
        label = 'SPA History API (pushState/replaceState)'
      } else if (hop.type === 'load') {
        label = `HTTP ${hop.statusCode || 200}`
      }
      return `${i + 1}. ${hop.url}\n   → ${label}`
    })

    const chainDesc = steps.join('\n')

    const hasTemporaryRedirect = redirects.some(
      (t) => t.statusCode === 302 || t.statusCode === 303 || t.statusCode === 307,
    )
    const hasClientRedirect = redirects.some((t) => t.type === 'client_redirect')
    const lastHop = trace[trace.length - 1]
    const hasMixedHttp =
      trace.some((t) => t.url.startsWith('http:')) && lastHop?.url.startsWith('https:') === true
    const tempRedirectCodes = redirects
      .filter((t) => t.statusCode === 302 || t.statusCode === 303 || t.statusCode === 307)
      .map((t) => t.statusCode)
    const uniqueTempCodes = [...new Set(tempRedirectCodes)]

    if (redirectCount === 0) {
      return buildResult(`Direct load (no redirects).\n\n${chainDesc}`, 'ok', 800, { trace, redirectCount })
    }

    if (hasClientRedirect) {
      return buildResult(
        `Client-side redirect detected (${redirectCount} hop${redirectCount > 1 ? 's' : ''}).\nClient redirects are slow and bad for SEO.\n\n${chainDesc}`,
        'error',
        100,
        { trace, redirectCount, issue: 'client_redirect' },
      )
    }

    if (redirectCount > 1) {
      return buildResult(
        `Redirect chain (${redirectCount} hops) - Performance impact.\n\n${chainDesc}`,
        'error',
        150,
        { trace, redirectCount, issue: 'long_chain' },
      )
    }

    if (hasTemporaryRedirect) {
      const codesStr = uniqueTempCodes.join(', ')
      return buildResult(
        `Temporary redirect (${codesStr}) detected.\nUse 301/308 for permanent redirects.\n\n${chainDesc}`,
        'warn',
        200,
        { trace, redirectCount, issue: 'temp_redirect', tempRedirectCodes: uniqueTempCodes },
      )
    }

    if (hasMixedHttp) {
      return buildResult(
        `HTTP → HTTPS redirect (${redirectCount} hop${redirectCount > 1 ? 's' : ''}).\n\n${chainDesc}`,
        'warn',
        250,
        { trace, redirectCount, issue: 'mixed_content' },
      )
    }

    return buildResult(
      `Single redirect (${redirectCount} hop).\n\n${chainDesc}`,
      'warn',
      300,
      { trace, redirectCount },
    )
  },
}
