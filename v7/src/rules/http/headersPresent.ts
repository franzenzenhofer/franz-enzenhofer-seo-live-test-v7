import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'HTTP Header Captured'
const RULE_ID = 'http:headers-present'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

const cacheField = (fromCache: boolean | undefined) =>
  textField('Served from cache', fromCache === true ? 'Yes' : fromCache === false ? 'No' : 'Not reported')

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
    const values = [
      textField('Headers captured', headerCount),
      textField('Main-document status', httpStatusLabel(page.status)),
      cacheField(page.fromCache),
    ]
    const checked = [textField('Measurement', 'Count of captured HTTP response header names'), textField('Criterion', 'At least one header captured')]
    if (!headerCount) {
      return presentResult(headersPresentRule, page, {
        input: 'Not captured', type: 'warn', priority: 350,
        values, checked, noMarkup: NO_MARKUP,
      })
    }
    return presentResult(headersPresentRule, page, {
      input: 'HTTP response headers', type: 'info', priority: 900,
      values, checked, noMarkup: NO_MARKUP,
    })
  },
}
