import { recordCounts } from './counts'
import { domPathField, originalField, textField } from './create'
import { isReconstructed, readOriginalMarkup } from './originalMarkup'
import type { DisplayField, EvidenceRecord } from './schema'
import { tagLabels } from './tagLabel'

import { getDomPath } from '@/shared/dom-path'

type Extra = (element: Element, index: number) => DisplayField[]

/**
 * Evidence for inspected elements (FORMATTING.md F4-F7): one original markup field and one evidence
 * record per element, both named by the element's tag label, plus the four truthful count rows.
 * `found` is how many elements the rule found; `elements` the ones it inspected in detail.
 */
export const elementRecords = (elements: Element[], found: number, extra: Extra = () => []) => {
  const labels = tagLabels(elements)
  const markup: Array<Extract<DisplayField, { kind: 'original' }>> = []
  const evidence: EvidenceRecord[] = elements.map((element, index) => {
    const captured = readOriginalMarkup(element)
    if (captured) markup.push(originalField(labels[index]!, captured.html))
    return { name: labels[index]!, fields: [
      ...extra(element, index),
      ...(captured ? [] : [textField('Markup', 'Not captured')]),
      domPathField('DOM path', captured?.selector ?? (isReconstructed(element.ownerDocument) ? null : getDomPath(element)), 'Not captured'),
    ] }
  })
  return { markup, evidence, counts: recordCounts({ found, markup: markup.length, evidence: evidence.length }) }
}
