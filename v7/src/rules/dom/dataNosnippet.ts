import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { clip, listRow } from '@/shared/presentation/listRow'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Data-nosnippet usage'
const RULE_ID = 'dom:data-nosnippet'
const SELECTOR = '[data-nosnippet]'
const SUPPORTED_TAGS = new Set(['SPAN', 'DIV', 'SECTION'])
const OVERVIEW_MARKUP_LIMIT = 3
const TEXT_LIMIT = 100

// tagLabel knows no identifying attribute for these elements; the attribute the rule queried names them.
const withAttribute = (label: string) => label.replace(/^<([a-z][a-z0-9-]*)>/, `<$1 data-nosnippet>`)
const elementText = (element: Element) => clip((element.textContent || '').replace(/\s+/g, ' ').trim() || 'Empty', TEXT_LIMIT)

export const dataNosnippetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#data-nosnippet-attr'],
    description: 'Finds elements carrying the data-nosnippet attribute: info on supported span/div/section usage, warn on unsupported tags Google ignores.',
  },
  async run(page) {
    const all = Array.from(page.doc.querySelectorAll(SELECTOR))
    const supported = (element: Element) => SUPPORTED_TAGS.has(element.tagName)
    const unsupported = all.filter((el) => !supported(el))
    // Every found element is shown, the unsupported ones first so a bounded sample never hides the finding.
    const { sample, total } = sampleElements([...unsupported, ...all.filter(supported)])
    const records = elementRecords(sample, total, (element) => [
      textField('Text', elementText(element)), textField('Attribute value', element.getAttribute('data-nosnippet') || 'Empty'),
      textField('Tag support', supported(element) ? 'Supported' : 'Unsupported'),
    ])
    const markup = records.markup.map((field) => ({ ...field, key: withAttribute(field.key) }))
    const evidence = records.evidence.map((record) => ({ ...record, name: withAttribute(record.name) }))
    const tags = (elements: Element[]) => listRow([...new Set(elements.map((el) => el.tagName.toLowerCase()))])
    // One element is shown by its markup, never as a count of 1 (FORMATTING.md F1, F3).
    const countRow = all.length > 1 ? [textField('Elements', all.length)] : []
    const tagsRow = unsupported.length ? textField('Unsupported tags', tags(unsupported)) : textField('Tags', tags(all))
    return presentResult(dataNosnippetRule, page, {
      input: 'Idle DOM',
      type: unsupported.length ? 'warn' : 'info', priority: unsupported.length ? 300 : all.length ? 700 : 910,
      values: all.length ? [...countRow, tagsRow, ...(markup.length <= OVERVIEW_MARKUP_LIMIT ? markup : [])] : [textField('data-nosnippet', 'Not found')],
      detailValues: total ? records.counts : [],
      checked: [textField('Selector', SELECTOR), textField('Supported tags', 'span, div, and section'),
        textField('Match', 'Attribute presence'), textField('Criterion', 'Reports supported usage; unsupported tags are warned')],
      evidence,
      markup,
      noMarkup: total ? 'Complete original data-nosnippet markup not retained' : 'No data-nosnippet attributes found',
    })
  },
}
