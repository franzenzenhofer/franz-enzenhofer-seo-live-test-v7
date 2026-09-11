import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Page summary (debug)'

export const pageSummaryRule: Rule = {
  id: 'debug:page-summary',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Info-only one-line debug summary: title text, header count, resource count.',
  },
  async run(page) {
    const titleEl = page.doc.querySelector('title')
    const titleText = (titleEl?.textContent || '').trim()
    const headerCount = (page.headers && Object.keys(page.headers).length) || 0
    const resourceCount = (page.resources || []).length
    const captured = markupEvidence(titleEl ? [titleEl] : [], 'Title')

    return presentResult(pageSummaryRule, page, {
      input: 'Static DOM + HTTP response headers + Navigation events',
      type: 'info',
      priority: 950,
      values: [
        textField('Title text', titleText || 'Not found'),
        textField('Header count', page.headers ? headerCount : 'Not captured'),
        textField('Resource count', page.resources ? resourceCount : 'Not captured'),
      ],
      checked: [
        textField('Selector', 'title'),
        textField('Selection', 'First match'),
        textField('Fields reported', 'Title element text, HTTP response header count, resource count'),
      ],
      detailValues: captured.fields,
      markup: captured.markup,
      noMarkup: titleEl ? 'Complete original <title> markup not retained' : 'No matching <title> element found',
    })
  },
}
