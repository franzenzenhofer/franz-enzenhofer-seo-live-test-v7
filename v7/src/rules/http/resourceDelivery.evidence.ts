import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'
import type { ResourceFact } from '@/shared/resourceFacts'

const LIMIT = 10

const describe = (fact: ResourceFact): DisplayField[] => {
  const contentType = fact.headers?.['content-type']
  return [
    urlField('URL', fact.url),
    textField('Resource type', fact.type || 'Not captured'),
    textField('Status', fact.status ? httpStatusLabel(fact.status) : fact.error ? 'Request failed' : 'Not captured'),
    ...(fact.error ? [textField('Error', fact.error)] : []),
    ...(contentType ? [textField('Content-Type', contentType)] : []),
  ]
}

/**
 * Each evidence category is bound to LIMIT records; the `records` row states exactly how many
 * of the category are shown instead of silently dropping the remainder.
 */
export const boundedEvidence = (label: string, facts: ResourceFact[]): { records: EvidenceRecord[]; shown: DisplayField[] } => {
  const kept = facts.slice(0, LIMIT)
  return {
    records: kept.map((fact, index) => ({ name: `${label} ${index + 1}`, fields: describe(fact) })),
    shown: facts.length ? [textField(`${label} records`, `${kept.length} of ${facts.length}`)] : [],
  }
}
