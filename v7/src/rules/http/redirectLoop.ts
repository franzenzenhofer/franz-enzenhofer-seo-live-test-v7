import { navigationPathSteps } from './navigationPathSteps'
import { combineInputs, httpUrlField, navigationStepEvidence } from './navigationStepEvidence'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule, Result } from '@/core/types'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Redirect Loop Detection'
const NOT_MARKUP = 'None - this rule checks recorded navigation events, not document markup'
const CHECKED = [
  textField('Navigation source', 'Recorded navigation ledger redirect and client-redirect hops'),
  textField('Duplicate detection', 'Same URL appearing more than once among the traced redirect hops'),
  textField('Criterion', 'No URL repeats within the traced redirect hops'),
]

export const redirectLoopRule: Rule = {
  id: 'http:redirect-loop', name: NAME, presentation: 1, enabled: true, what: 'http',
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
    const build = (type: Result['type'], priority: number, input: string, values: ReturnType<typeof textField>[], detailValues: ReturnType<typeof textField>[] = [], evidence: ReturnType<typeof navigationStepEvidence> = []) =>
      presentResult(redirectLoopRule, page, { input, type, priority, values, detailValues, checked: CHECKED, evidence, noMarkup: NOT_MARKUP })

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
    const redirectTrace = trace.filter((hop) => hop.type === 'http_redirect' || hop.type === 'client_redirect')

    if (redirectTrace.length === 0) {
      return build('ok', 800, input, [textField('Redirects observed', 0), textField('Loop detected', 'No')], [], evidence)
    }

    const urlCounts = new Map<string, number>()
    for (const hop of redirectTrace) urlCounts.set(hop.url, (urlCounts.get(hop.url) || 0) + 1)
    const loopUrls = Array.from(urlCounts.entries()).filter(([, count]) => count > 1).map(([url, count]) => ({ url, count }))

    if (loopUrls.length === 0) {
      return build('ok', 800, input, [textField('Redirect hops checked', redirectTrace.length), textField('Loop detected', 'No')],
        [textField('Unique URLs visited', urlCounts.size)], evidence)
    }

    return build('error', 50, input, [textField('Loop detected', 'Yes'), textField('Looping URLs', loopUrls.length)],
      [textField('Redirect hops checked', redirectTrace.length)],
      [...evidence, ...loopUrls.map((loop, index) => ({
        name: `Loop ${index + 1}`,
        fields: [httpUrlField('URL', loop.url), textField('Occurrences', loop.count)],
      }))])
  },
}
