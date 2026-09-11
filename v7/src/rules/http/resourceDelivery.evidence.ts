import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'
import type { ResourceFact } from '@/shared/resourceFacts'

const LIMIT = 10

const describe = (fact: ResourceFact): DisplayField[] => {
  const contentType = fact.headers?.['content-type']
  return [
    urlField('URL', fact.url),
    textField('Resource type', fact.type || 'Unknown'),
    textField('Status', fact.status ? httpStatusLabel(fact.status) : fact.error ? 'Network error' : 'Unknown'),
    ...(fact.error ? [textField('Error', fact.error)] : []),
    ...(contentType ? [textField('Content-Type', contentType)] : []),
  ]
}

// Bound each evidence category to LIMIT records, reporting exactly how many
// were retained vs omitted rather than silently dropping the remainder.
export const boundedEvidence = (label: string, facts: ResourceFact[]) => {
  const shown = facts.slice(0, LIMIT)
  return {
    records: shown.map((fact, index) => ({ name: `${label} ${index + 1}`, fields: describe(fact) })),
    retained: shown.length,
    omitted: Math.max(0, facts.length - LIMIT),
  }
}
