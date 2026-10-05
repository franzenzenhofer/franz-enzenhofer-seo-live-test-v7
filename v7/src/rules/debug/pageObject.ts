import { combineInputs } from '@/rules/http/navigationStepEvidence'
import { httpResponseInput } from '@/shared/httpResponseInput'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Page object snapshot'

export const pageObjectRule: Rule = {
  id: 'debug:page-object',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Info-only debug dump of the raw page object: URL, status, headers, resource list, cache flag.',
  },
  async run(page) {
    const headerCount = Object.keys(page.headers || {}).length
    const resourceCount = (page.resources || []).length

    return presentResult(pageObjectRule, page, {
      input: combineInputs('Page URL', httpResponseInput(page), 'Navigation events'),
      type: 'info',
      priority: 900,
      values: [
        /^https?:\/\//i.test(page.url) ? urlField('Current page URL', page.url) : textField('Current page URL', page.url || 'Empty'),
        textField('Response status', httpStatusLabel(page.status)),
        textField('Header count', page.headers ? headerCount : 'Not captured'),
        textField('Resource count', page.resources ? resourceCount : 'Not captured'),
        textField('Served from', page.fromCache === undefined ? 'Not captured' : page.fromCache ? 'Cache' : 'Network'),
      ],
      checked: [
        textField('Fields reported', 'Page URL, main-document response status, header count, resource count, cache flag'),
      ],
      noMarkup: 'None - this rule reports the raw page object, not document markup',
    })
  },
}
