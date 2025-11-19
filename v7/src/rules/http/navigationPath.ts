import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'Navigation Path Analysis'
const RULE_ID = 'http:navigation-path'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections'

export const navigationPathRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',

  async run(page, ctx): Promise<import('@/core/types').Result> {
    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)

    if (!ledgerResult.success) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Navigation path data unavailable.',
        type: 'info',
        priority: 900,
        details: {
          reference: SPEC,
        },
      }
    }

    const { trace } = ledgerResult.data

    if (trace.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No navigation events recorded.',
        type: 'info',
        priority: 900,
        details: {
          reference: SPEC,
        },
      }
    }

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
    const redirectCount = Math.max(0, trace.length - 1)

    const has302 = trace.some((t) => t.statusCode === 302)
    const hasClientRedirect = trace.some((t) => t.type === 'client_redirect')
    const lastHop = trace[trace.length - 1]
    const hasMixedHttp =
      trace.some((t) => t.url.startsWith('http:')) &&
      lastHop?.url.startsWith('https:') === true

    if (redirectCount === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: `Direct load (no redirects).\n\n${chainDesc}`,
        type: 'ok',
        priority: 800,
        details: {
          trace,
          redirectCount,
          reference: SPEC,
        },
      }
    }

    if (hasClientRedirect) {
      return {
        label: LABEL,
        name: NAME,
        message: `Client-side redirect detected (${redirectCount} hop${redirectCount > 1 ? 's' : ''}).\nClient redirects are slow and bad for SEO.\n\n${chainDesc}`,
        type: 'error',
        priority: 100,
        details: {
          trace,
          redirectCount,
          issue: 'client_redirect',
          reference: SPEC,
        },
      }
    }

    if (redirectCount > 1) {
      return {
        label: LABEL,
        name: NAME,
        message: `Redirect chain (${redirectCount} hops) - Performance impact.\n\n${chainDesc}`,
        type: 'error',
        priority: 150,
        details: {
          trace,
          redirectCount,
          issue: 'long_chain',
          reference: SPEC,
        },
      }
    }

    if (has302) {
      return {
        label: LABEL,
        name: NAME,
        message: `Temporary redirect (302) detected.\nUse 301 for permanent redirects.\n\n${chainDesc}`,
        type: 'warn',
        priority: 200,
        details: {
          trace,
          redirectCount,
          issue: 'temp_redirect',
          reference: SPEC,
        },
      }
    }

    if (hasMixedHttp) {
      return {
        label: LABEL,
        name: NAME,
        message: `HTTP → HTTPS redirect (${redirectCount} hop${redirectCount > 1 ? 's' : ''}).\n\n${chainDesc}`,
        type: 'warn',
        priority: 250,
        details: {
          trace,
          redirectCount,
          issue: 'mixed_content',
          reference: SPEC,
        },
      }
    }

    return {
      label: LABEL,
      name: NAME,
      message: `Single redirect (${redirectCount} hop).\n\n${chainDesc}`,
      type: 'warn',
      priority: 300,
      details: {
        trace,
        redirectCount,
        reference: SPEC,
      },
    }
  },
}
