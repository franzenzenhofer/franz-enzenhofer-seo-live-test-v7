import { navigationPathSteps } from './navigationPathSteps'
import { combineInputs, navigationStepEvidence } from './navigationStepEvidence'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Observed Redirect Efficiency'
const NOT_MARKUP = 'None - this rule checks recorded navigation events, not document markup'
const CHECKED = [
  textField('Navigation source', 'Recorded navigation ledger redirect and client-redirect hops'),
  textField('Warning threshold', '2 or more redirect hops before the final response'),
  textField('Criterion', 'Fewer than 2 redirect hops before the final response'),
]

export const redirectEfficiencyRule: Rule = {
  id: 'http:redirect-efficiency', name: NAME, presentation: 1, enabled: true, what: 'http',
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
    const build = (type: Result['type'], priority: number, input: string, values: ReturnType<typeof textField>[], detailValues: ReturnType<typeof textField>[] = [], evidence: ReturnType<typeof navigationStepEvidence> = []) =>
      presentResult(redirectEfficiencyRule, page, { input, type, priority, values, detailValues, checked: CHECKED, evidence, noMarkup: NOT_MARKUP })

    if (!hasHeaders(page.headers)) return build('runtime_error', 50, 'Not captured', [textField('HTTP response headers', 'Not captured')])

    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success || ledgerResult.data.trace.length === 0) {
      return build('info', 900, 'HTTP response headers', [textField('Navigation data', 'Not captured')])
    }

    const { trace } = ledgerResult.data
    const steps = navigationPathSteps(page, trace)
    const evidence = navigationStepEvidence(steps, page.headerChain)
    const input = combineInputs('Navigation events', (page.headerChain?.length ?? 0) > 0 && 'Main-document HTTP response')
    const totalHops = trace.length
    const redirects = trace.filter((h) => h.type === 'http_redirect' || h.type === 'client_redirect')
    const httpRedirects = redirects.filter((h) => h.type === 'http_redirect')
    const clientRedirects = redirects.filter((h) => h.type === 'client_redirect')
    const tempRedirects = httpRedirects.filter((h) => h.statusCode === 302 || h.statusCode === 303 || h.statusCode === 307)
    const permRedirects = httpRedirects.filter((h) => h.statusCode === 301 || h.statusCode === 308)

    if (redirects.length === 0) {
      return build('ok', 900, input, [textField('Redirect hops', 0), textField('Total hops', totalHops)], [], evidence)
    }

    const isChain = redirects.length >= 2
    return build(isChain ? 'warn' : 'ok', isChain ? 200 : 800, input,
      [textField('Redirect hops', redirects.length), textField('HTTP redirects', httpRedirects.length), textField('Client-side redirects', clientRedirects.length)],
      [textField('Permanent redirects', permRedirects.length), textField('Temporary redirects', tempRedirects.length), textField('Total hops', totalHops)],
      evidence)
  },
}
