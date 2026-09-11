import { navigationPathSteps } from './navigationPathSteps'
import { combineInputs, navigationStepEvidence } from './navigationStepEvidence'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders } from '@/shared/http-utils'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Navigation Path Analysis'
const NOT_MARKUP = 'None - this rule checks recorded navigation events, not document markup'
const CHECKED = [
  textField('Navigation source', 'Recorded navigation ledger and main-document response events'),
  textField('Client-side redirect criterion', 'A client-side (JavaScript or meta refresh) redirect fails this check'),
  textField('Chain-length criterion', 'More than 1 redirect hop warns (Googlebot follows up to 10 hops)'),
  textField('Redirect-status criterion', 'Single redirect: temporary (302/303/307) warns; permanent (301/308) HTTP to HTTPS passes; any other is an observation'),
  textField('Direct-load criterion', 'No redirect hop passes'),
  textField('Destination criterion', 'A 4xx/5xx final response fails this check'),
]

export const navigationPathRule: Rule = {
  id: 'http:navigation-path', name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    userGuide: {
      check: "Shows how this page loaded, step by step, using captured navigation and response events. Status codes include their names. Browser history updates are shown separately because they do not add HTTP redirects.",
      action: "Check whether the move is intentional and whether the final destination works. Use a permanent redirect for a permanent move; keep a temporary redirect when the move really is temporary.",
    },
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
    const build = (type: Result['type'], priority: number, input: string, values: ReturnType<typeof textField>[], detailValues: ReturnType<typeof textField>[] = [], evidence: ReturnType<typeof navigationStepEvidence> = []) =>
      presentResult(navigationPathRule, page, { input, type, priority, values, detailValues, checked: CHECKED, evidence, noMarkup: NOT_MARKUP })

    if (!hasHeaders(page.headers)) return build('runtime_error', 50, 'Not captured', [textField('HTTP response headers', 'Not captured')])

    const raw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledgerResult = NavigationLedgerSchema.safeParse(raw)
    if (!ledgerResult.success) return build('info', 900, 'HTTP response headers', [textField('Navigation data', 'Unavailable')])

    const { trace } = ledgerResult.data
    if (trace.length === 0) return build('info', 900, 'HTTP response headers', [textField('Navigation events recorded', 0)])

    const steps = navigationPathSteps(page, trace)
    const evidence = navigationStepEvidence(steps, page.headerChain)
    const input = combineInputs('Navigation events', (page.headerChain?.length ?? 0) > 0 && 'Main-document HTTP response')
    const redirects = steps.filter((hop) => hop.type === 'http_redirect' || hop.type === 'client_redirect')
    const redirectCount = redirects.length
    const clientRedirectCount = redirects.filter((t) => t.type === 'client_redirect').length
    const hasTemporaryRedirect = redirects.some((t) => t.statusCode === 302 || t.statusCode === 303 || t.statusCode === 307)
    const hasClientRedirect = clientRedirectCount > 0
    const lastHop = steps[steps.length - 1]
    const hasMixedHttp = steps.some((t) => t.url.startsWith('http:')) && lastHop?.url.startsWith('https:') === true
    const tempCodes = [...new Set(redirects.filter((t) => t.statusCode === 302 || t.statusCode === 303 || t.statusCode === 307).map((t) => t.statusCode))]
    const lastResponse = steps.filter((hop) => hop.type !== 'history_api').at(-1)

    const facts = [textField('Redirect hops', redirectCount), textField('Client-side redirects', clientRedirectCount),
      textField('Final response status', lastResponse?.statusCode !== undefined ? httpStatusLabel(lastResponse.statusCode) : 'Not captured')]
    const details = [textField('Scheme change to HTTPS', hasMixedHttp ? 'Yes' : 'No'),
      ...(tempCodes.length ? [textField('Temporary status codes', tempCodes.map(httpStatusLabel).join(', '))] : [])]

    if ((lastResponse?.statusCode ?? 0) >= 400) return build('error', 100, input, facts, details, evidence)
    if (redirectCount === 0) return build('ok', 800, input, facts, details, evidence)
    if (hasClientRedirect) return build('error', 100, input, facts, details, evidence)
    if (redirectCount > 1) return build('warn', 200, input, facts, details, evidence)
    if (hasTemporaryRedirect) return build('warn', 200, input, facts, details, evidence)
    if (hasMixedHttp && redirects.every((hop) => hop.statusCode === 301 || hop.statusCode === 308)) return build('ok', 750, input, facts, details, evidence)
    if (!redirects.every((hop) => hop.statusCode === 301 || hop.statusCode === 308)) return build('info', 700, input, facts, details, evidence)
    return build('info', 700, input, facts, details, evidence)
  },
}
