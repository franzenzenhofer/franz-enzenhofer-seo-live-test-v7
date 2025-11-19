import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'Redirect Efficiency Score'
const RULE_ID = 'http:redirect-efficiency'
const SPEC = 'https://web.dev/redirects/'

export const redirectEfficiencyRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',

  async run(page, ctx): Promise<Result> {
    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)

    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No navigation data available for efficiency scoring.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    const { trace } = ledgerResult.data
    const totalHops = trace.length
    const redirects = trace.filter((h) => h.type === 'http_redirect' || h.type === 'client_redirect')
    const httpRedirects = redirects.filter((h) => h.type === 'http_redirect')
    const clientRedirects = redirects.filter((h) => h.type === 'client_redirect')
    const tempRedirects = httpRedirects.filter((h) => h.statusCode === 302 || h.statusCode === 303 || h.statusCode === 307)
    const permRedirects = httpRedirects.filter((h) => h.statusCode === 301 || h.statusCode === 308)

    let score = 100
    let issues: string[] = []

    if (redirects.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: `Perfect! Direct load with no redirects (Score: 100/100).\n\nOptimal performance - the page loaded directly without any intermediate hops.`,
        type: 'ok',
        priority: 900,
        details: { score, redirects: 0, httpRedirects: 0, clientRedirects: 0, reference: SPEC },
      }
    }

    // Scoring deductions
    score -= redirects.length * 15 // -15 per redirect
    if (redirects.length > 0) issues.push(`${redirects.length} redirect${redirects.length > 1 ? 's' : ''} (-${redirects.length * 15})`)

    if (clientRedirects.length > 0) {
      score -= clientRedirects.length * 25 // Extra penalty for client redirects
      issues.push(`${clientRedirects.length} client-side redirect${clientRedirects.length > 1 ? 's' : ''} (-${clientRedirects.length * 25} extra penalty)`)
    }

    if (tempRedirects.length > 0) {
      score -= tempRedirects.length * 10 // Extra penalty for temporary redirects
      issues.push(`${tempRedirects.length} temporary redirect${tempRedirects.length > 1 ? 's' : ''} (-${tempRedirects.length * 10} extra penalty)`)
    }

    score = Math.max(0, score)

    const issuesDesc = issues.map((i) => `  • ${i}`).join('\n')
    const summary = `
Total hops: ${totalHops}
HTTP redirects: ${httpRedirects.length} (${permRedirects.length} permanent, ${tempRedirects.length} temporary)
Client redirects: ${clientRedirects.length}
`.trim()

    let type: Result['type'] = 'ok'
    let message = ''

    if (score >= 85) {
      type = 'ok'
      message = `Good redirect efficiency (Score: ${score}/100).\n\n${summary}\n\nPerformance issues:\n${issuesDesc}`
    } else if (score >= 60) {
      type = 'warn'
      message = `Moderate redirect overhead (Score: ${score}/100).\n\n${summary}\n\nPerformance issues:\n${issuesDesc}`
    } else {
      type = 'error'
      message = `Poor redirect efficiency (Score: ${score}/100).\n\n${summary}\n\nCritical performance issues:\n${issuesDesc}`
    }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'error' ? 100 : type === 'warn' ? 200 : 800,
      details: {
        score,
        totalHops,
        redirects: redirects.length,
        httpRedirects: httpRedirects.length,
        clientRedirects: clientRedirects.length,
        permanentRedirects: permRedirects.length,
        temporaryRedirects: tempRedirects.length,
        issues,
        reference: SPEC,
      },
    }
  },
}
