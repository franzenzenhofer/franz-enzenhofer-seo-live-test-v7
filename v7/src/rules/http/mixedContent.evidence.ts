import type { Offender } from './mixedContentResources'

import { originalField, pathField, textField, urlField } from '@/shared/presentation/create'
import { readOriginalMarkup } from '@/shared/presentation/originalMarkup'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'
import { tagLabels } from '@/shared/presentation/tagLabel'
import type { ResourceIssue } from '@/shared/resourceIssues'

const EXCERPT_LIMIT = 200

// Element-derived text (alt/aria-label/title/id/name, or a decoded filename) shown
// in evidence must stay a bounded, clearly labelled excerpt - never an implied
// complete original value. Original markup, when retained, lives in `markup`.
export const excerpt = (value: string): string =>
  value.length > EXCERPT_LIMIT ? `${value.slice(0, EXCERPT_LIMIT)} [truncated]` : value

const issueFields = (issue: ResourceIssue): DisplayField[] => [
  textField('Kind', issue.kind),
  textField('Label', excerpt(issue.name)),
  urlField('HTTP URL', issue.url),
  textField('Location', issue.location),
  ...(issue.selector ? [pathField('DOM path', issue.selector)] : []),
]

type Original = Extract<DisplayField, { kind: 'original' }>

/**
 * One evidence record per offender (F7) and one original markup field per DOM offender whose
 * markup was captured (F4), both named by the element's tag label; network-only offenders are
 * named `Network resource` (numbered when several).
 */
export const offenderEvidence = (shown: Offender[]): { evidence: EvidenceRecord[]; markup: Original[] } => {
  const labels = tagLabels(shown.flatMap((offender) => offender.element ? [offender.element] : []))
  const networkTotal = shown.filter((offender) => !offender.element).length
  const markup: Original[] = []
  let elementIndex = 0
  let networkIndex = 0
  const evidence = shown.map((offender): EvidenceRecord => {
    if (!offender.element) return { name: networkTotal > 1 ? `Network resource ${++networkIndex}` : 'Network resource', fields: issueFields(offender.issue) }
    const name = labels[elementIndex++]!
    const captured = readOriginalMarkup(offender.element)
    if (captured) markup.push(originalField(name, captured.html))
    return { name, fields: issueFields(offender.issue) }
  })
  return { evidence, markup }
}
