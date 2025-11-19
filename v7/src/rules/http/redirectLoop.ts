import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'Redirect Loop Detection'
const RULE_ID = 'http:redirect-loop'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections#redirect_loops'

export const redirectLoopRule: Rule = {
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
        message: 'No navigation data available for loop detection.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    const { trace } = ledgerResult.data
    const urls = trace.map((hop) => hop.url)
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
        message: `No redirect loops detected (${trace.length} unique URLs).`,
        type: 'ok',
        priority: 800,
        details: {
          trace,
          uniqueUrlCount: urlCounts.size,
          reference: SPEC,
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
        loopUrls,
        reference: SPEC,
      },
    }
  },
}
