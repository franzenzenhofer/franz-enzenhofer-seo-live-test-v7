import type { SchemaValidationResult } from './createSchemaRule'

import { textField } from '@/shared/presentation/create'
import { schemaTypes } from '@/shared/structured'
import type { EvidenceRecord } from '@/shared/presentation/schema'
import type { LdEntry } from '@/shared/structuredParse'

const ENTITY_LIMIT = 10
const NAME_EXCERPT_LIMIT = 200

type Checked = LdEntry & { validation: SchemaValidationResult }

// name/headline/title text is arbitrary page content and can be long - bound it and
// label the field as an excerpt whenever it was cut, per the original-data field guarantee.
const nameField = (node: Record<string, unknown>) => {
  const found = [node['name'], node['headline'], node['title'], node['@id']]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0) || 'Unnamed entity'
  const truncated = found.length > NAME_EXCERPT_LIMIT
  return textField(truncated ? 'Name (excerpt)' : 'Name', truncated ? found.slice(0, NAME_EXCERPT_LIMIT) : found)
}

/**
 * One evidence record per matching entity: name/headline, resolved @type, the
 * numbered source block it came from, and the field-check outcome. Never
 * pretends a presence-only check validated fields.
 */
export const entityEvidence = (checks: Checked[], fallbackType: string, presenceOnly: boolean, defaultLabel: string) => {
  const shown = checks.slice(0, ENTITY_LIMIT)
  const records: EvidenceRecord[] = shown.map(({ node, scriptIndex, validation }, index) => ({
    name: `Entity ${index + 1}`,
    fields: [
      nameField(node),
      textField('Schema type', schemaTypes(node).join(', ') || fallbackType),
      textField('Source block', scriptIndex + 1),
      textField('Field check', presenceOnly ? 'Presence only; fields not checked'
        : validation.ok ? 'Checked fields present' : `Missing ${validation.fieldsLabel || defaultLabel} fields`),
      ...(validation.missing?.length ? [textField('Missing fields', validation.missing.join(', '))] : []),
    ],
  }))
  return { records, omitted: checks.length - shown.length }
}

/** One evidence record per malformed JSON-LD block: its position and a bounded error excerpt. */
export const errorEvidence = (errors: Array<{ scriptIndex: number; message: string }>): EvidenceRecord[] =>
  errors.map(({ scriptIndex, message }) => ({
    name: `JSON-LD script ${scriptIndex + 1}`,
    fields: [textField('Script number', scriptIndex + 1), textField('Parse error excerpt', message)],
  }))
