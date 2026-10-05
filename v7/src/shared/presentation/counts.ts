import { textField } from './create'
import type { DisplayField } from './schema'

// The four fixed record-count rows (FORMATTING.md F6). Rules state how many elements they found;
// retained counts always equal the records shipped, and the storage bound keeps them truthful.
export const COUNT_KEYS = ['Markup retained', 'Markup omitted', 'Evidence retained', 'Evidence omitted'] as const
type Counts = { found: number; markup: number; evidence: number }

export const recordCounts = ({ found, markup, evidence }: Counts): DisplayField[] => [
  textField('Markup retained', markup), textField('Markup omitted', Math.max(0, found - markup)),
  textField('Evidence retained', evidence), textField('Evidence omitted', Math.max(0, found - evidence)),
]

const countOf = (fields: DisplayField[], key: string) => {
  const value = fields.find((field) => field.key === key)?.value
  return typeof value === 'number' ? value : 0
}

/** Rewrites the four rows after `dropped` markup/evidence records were removed for storage. */
export const adjustCounts = (fields: DisplayField[], kept: { markup: number; evidence: number }, dropped: { markup: number; evidence: number }) => {
  const others = fields.filter((field) => !(COUNT_KEYS as readonly string[]).includes(field.key))
  const omittedMarkup = countOf(fields, 'Markup omitted') + dropped.markup
  const omittedEvidence = countOf(fields, 'Evidence omitted') + dropped.evidence
  return [...others,
    textField('Markup retained', kept.markup), textField('Markup omitted', omittedMarkup),
    textField('Evidence retained', kept.evidence), textField('Evidence omitted', omittedEvidence)]
}
