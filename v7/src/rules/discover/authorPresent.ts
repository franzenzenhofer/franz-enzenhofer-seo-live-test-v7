import { entriesOfScript, ldTypesRow, overviewMarkup, parseErrorField, parseErrorRow } from './discoverPresentation'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { parseLdDetails } from '@/shared/structured'
import { listRow } from '@/shared/presentation/listRow'

const META_SELECTOR = 'meta[name="author" i]'
const LD_SELECTOR = 'script[type="application/ld+json"]'
const EVIDENCE_LIST_MAX_CHARS = 160
const checked = [textField('Author meta selector', META_SELECTOR), textField('JSON-LD selector', LD_SELECTOR),
  textField('Author extraction', 'String author values and object name values from parsed JSON-LD'),
  textField('Criterion', 'Reports declared author names; no name is informational'), textField('Visible byline', 'Not checked')]

const authorNames = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(authorNames)
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (value && typeof value === 'object') return authorNames((value as Record<string, unknown>)['name'])
  return []
}
export const discoverAuthorPresentRule: Rule = {
  id: 'discover:author', name: 'Author metadata', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://html.spec.whatwg.org/multipage/semantics.html#meta-author',
    ],
    description: 'Reports author names and their actual meta or JSON-LD sources. Missing optional author metadata is informational.',
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const metaElements = Array.from(page.doc.querySelectorAll(META_SELECTOR))
    const ldScripts = Array.from(page.doc.querySelectorAll(LD_SELECTOR))
    const metaNames = (element: Element) => authorNames(element.getAttribute('content'))
    const scriptNames = (scriptIndex: number) => entriesOfScript(parsed, scriptIndex).flatMap((node) => authorNames(node['author']))
    const authors = [...metaElements.flatMap(metaNames), ...ldScripts.flatMap((_script, index) => scriptNames(index))]
    const names = [...new Set(authors)]
    const { sample, total } = sampleElements([...metaElements, ...ldScripts])
    // One record per inspected element: the author names it declares, or why a script could not be read.
    const records = elementRecords(sample, total, (element, index) => {
      const scriptIndex = index - metaElements.length
      const declared = scriptIndex < 0 ? metaNames(element) : scriptNames(scriptIndex)
      return [textField('Authors', declared.length ? listRow(declared, EVIDENCE_LIST_MAX_CHARS) : 'Not found'),
        ...(scriptIndex < 0 ? [] : parseErrorField(parsed, scriptIndex))]
    })
    return presentResult(discoverAuthorPresentRule, page, {
      input: 'Idle DOM', type: parsed.errorCount ? 'warn' : 'info', priority: 750,
      values: [textField('Author names', names.length ? listRow(names) : 'Not found'),
        ...(names.length ? [] : ldTypesRow(parsed)), ...parseErrorRow(parsed), ...overviewMarkup(records.markup)],
      detailValues: [textField('Author declarations', authors.length), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original author source markup not retained' : 'No author meta tag or JSON-LD script found',
    })
  },
}
