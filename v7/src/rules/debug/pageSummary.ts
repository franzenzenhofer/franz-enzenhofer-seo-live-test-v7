import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { clip } from '@/shared/presentation/listRow'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Page summary (debug)'
const SELECTOR = 'title'
const EVIDENCE_VALUE_LIMIT = 160

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
    const titles = page.doc.querySelectorAll(SELECTOR)
    const titleEl = titles[0]
    const titleText = (titleEl?.textContent || '').trim()
    const headerCount = (page.headers && Object.keys(page.headers).length) || 0
    const resourceCount = (page.resources || []).length
    // The first title is inspected; its full text is evidence, the overview carries a scan-length excerpt.
    const records = elementRecords(titleEl ? [titleEl] : [], titles.length, () => [textField('Text', clip(titleText || 'Empty', EVIDENCE_VALUE_LIMIT))])
    const overviewMarkup = records.markup.length === 1 ? records.markup : []

    return presentResult(pageSummaryRule, page, {
      input: 'Static DOM + HTTP response headers + Navigation events',
      type: 'info',
      priority: 950,
      values: [
        textField('Title', titleEl ? clip(titleText || 'Empty') : 'Not found'),
        textField('Header count', page.headers ? headerCount : 'Not captured'),
        textField('Resource count', page.resources ? resourceCount : 'Not captured'),
        ...overviewMarkup,
      ],
      checked: [
        textField('Selector', SELECTOR),
        textField('Selection', 'First match'),
        textField('Fields reported', 'Title element text, HTTP response header count, resource count'),
      ],
      detailValues: titleEl ? records.counts : [],
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: !titleEl ? 'No matching <title> element found'
        : records.markup.length ? 'Complete original <title> markup not retained' : 'Not retained: the title is rebuilt from navigation events, not captured as original markup',
    })
  },
}
