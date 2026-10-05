import { entriesOfScript, ldTypesRow, overviewMarkup, parseErrorField, parseErrorRow } from './discoverPresentation'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { parseLdDetails } from '@/shared/structured'

type DateType = 'Published' | 'Modified'
type Declared = { dateType: DateType; value: string }
const FIELDS: Array<{ key: string; property: string; dateType: DateType }> = [
  { key: 'datePublished', property: 'article:published_time', dateType: 'Published' },
  { key: 'dateModified', property: 'article:modified_time', dateType: 'Modified' },
]
const META_SELECTOR = FIELDS.map(({ property }) => `meta[property="${property}" i]`).join(', ')
const LD_SELECTOR = 'script[type="application/ld+json"]'
const checked = [
  textField('Selectors', `${META_SELECTOR}, ${LD_SELECTOR}`),
  textField('Meta attributes', 'property and content'), textField('JSON-LD properties', FIELDS.map(({ key }) => key).join(' and ')),
  textField('Matching', 'Non-empty string values, trimmed'),
  textField('Date format', 'Not validated'), textField('Visible date', 'Not checked'),
]
const metaProperty = (element: Element) => (element.getAttribute('property') || '').trim().toLowerCase()
const metaContent = (element: Element) => (element.getAttribute('content') || '').trim()
const metaDates = (element: Element): Declared[] => {
  const field = FIELDS.find(({ property }) => property === metaProperty(element))
  return field && metaContent(element) ? [{ dateType: field.dateType, value: metaContent(element) }] : []
}
const scriptDates = (nodes: Array<Record<string, unknown>>) => FIELDS.flatMap(({ key, dateType }) => nodes.flatMap((node) => {
  const value = node[key]
  return typeof value === 'string' && value.trim() ? [{ key, dateType, value: value.trim() }] : []
}))
const firstDate = (dates: Declared[], dateType: DateType) => dates.find((date) => date.dateType === dateType)?.value

export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time', name: 'Publication dates', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/article', 'https://ogp.me/'],
    description: 'Lists declared publication and modification dates with their exact sources; absence of optional metadata is informational.',
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const metaNodes = Array.from(page.doc.querySelectorAll(META_SELECTOR))
    const scripts = Array.from(page.doc.querySelectorAll(LD_SELECTOR))
    const dates: Declared[] = [...metaNodes.flatMap(metaDates), ...scripts.flatMap((_script, index) => scriptDates(entriesOfScript(parsed, index)))]
    const published = firstDate(dates, 'Published')
    const modified = firstDate(dates, 'Modified')
    const { sample, total } = sampleElements([...metaNodes, ...scripts])
    // One record per inspected element: the meta content, or the date properties a script declares.
    const records = elementRecords(sample, total, (element, index): DisplayField[] => {
      const scriptIndex = index - metaNodes.length
      if (scriptIndex < 0) return [textField('content', metaContent(element) || 'Empty')]
      const declared = scriptDates(entriesOfScript(parsed, scriptIndex)).map(({ key, value }) => textField(key, value))
      return [...(declared.length ? declared : [textField('Dates', 'Not found')]), ...parseErrorField(parsed, scriptIndex)]
    })
    // An identical modified date is still a separate fact; the suffix keeps the two rows distinct (F3).
    const modifiedValue = !modified ? 'Not found' : modified === published ? `${modified} (unchanged)` : modified
    return presentResult(discoverPublishedTimeRule, page, {
      input: 'Idle DOM', type: parsed.errorCount ? 'warn' : 'info', priority: 800,
      values: [textField('Published', published || 'Not found'), textField('Modified', modifiedValue),
        ...(dates.length ? [] : ldTypesRow(parsed)), ...parseErrorRow(parsed), ...overviewMarkup(records.markup)],
      detailValues: [textField('Published declarations', dates.filter(({ dateType }) => dateType === 'Published').length),
        textField('Modified declarations', dates.filter(({ dateType }) => dateType === 'Modified').length), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original checked metadata not retained' : 'No date meta tags or JSON-LD scripts found',
    })
  },
}
