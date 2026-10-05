import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import type { Page, Rule } from '@/core/types'

const NAME = 'HTTP Header Captured'
const RULE_ID = 'http:headers-present'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

// The response facts the capture carries; a fact the capture does not carry gets no row.
const responseFacts = (page: Page): DisplayField[] => [
  ...(typeof page.status === 'number' ? [textField('Main-document status', httpStatusLabel(page.status))] : []),
  ...(page.fromCache === undefined ? [] : [textField('Served from', page.fromCache ? 'Browser cache' : 'Network')]),
]

export const headersPresentRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'franz',
    references: [],
    description:
      'Diagnostic meta-check: warns when no HTTP response headers were captured for the page load (e.g. served from cache, so header-dependent rules cannot run), otherwise reports the captured header count as info.',
  },
  async run(page) {
    const headerCount = Object.keys(page.headers || {}).length
    const checked = [textField('Measurement', 'Count of captured HTTP response header names'), textField('Criterion', 'At least one header captured')]
    if (!headerCount) {
      return presentResult(headersPresentRule, page, {
        input: 'Not captured', type: 'warn', priority: 350,
        values: [textField('Response headers', 'Not captured'), ...responseFacts(page)], checked, noMarkup: NO_MARKUP,
      })
    }
    return presentResult(headersPresentRule, page, {
      input: 'HTTP response headers', type: 'info', priority: 900,
      values: [textField('Headers captured', headerCount), ...responseFacts(page)], checked, noMarkup: NO_MARKUP,
    })
  },
}
