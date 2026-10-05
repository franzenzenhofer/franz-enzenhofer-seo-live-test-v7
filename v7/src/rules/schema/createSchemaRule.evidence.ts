import type { SchemaValidationResult } from './createSchemaRule'

import { textField } from '@/shared/presentation/create'
import { clip, listRow } from '@/shared/presentation/listRow'
import type { DisplayField } from '@/shared/presentation/schema'
import type { LdEntry } from '@/shared/structuredParse'

const ENTITY_LIMIT = 10
const EVIDENCE_VALUE_LIMIT = 160

export type Checked = LdEntry & { validation: SchemaValidationResult }
type MatchedType = (node: Record<string, unknown>) => string

const nameOf = (node: Record<string, unknown>) => [node['name'], node['headline'], node['title'], node['@id']]
  .find((value): value is string => typeof value === 'string' && value.trim().length > 0)

// Presence-only rules add no field-check row: the checked row `Entity fields: Not validated` states it once.
const fieldCheck = (key: string, validation: SchemaValidationResult, presenceOnly: boolean): DisplayField[] => presenceOnly ? []
  : [textField(`${key} fields`, validation.ok ? 'Present' : `Missing: ${listRow(validation.missing || [], EVIDENCE_VALUE_LIMIT - 9)}`)]

/**
 * Entity facts as fields of the <script> record they were parsed from (FORMATTING.md F7): for every
 * matching entity its name (or headline/title/@id) keyed by the matched type, and the field-check
 * outcome keyed `<type> fields`. Keys are numbered only when a script holds several of one type.
 * Never pretends a presence-only check validated fields.
 */
export const entityFields = (checks: Checked[], matchedType: MatchedType, presenceOnly: boolean) => {
  const shown = checks.slice(0, ENTITY_LIMIT)
  const byScript = new Map<number, Checked[]>()
  for (const check of shown) byScript.set(check.scriptIndex, [...(byScript.get(check.scriptIndex) || []), check])
  const fields = (scriptIndex: number): DisplayField[] => {
    const entities = byScript.get(scriptIndex) || []
    const totals = new Map<string, number>()
    entities.forEach((entity) => totals.set(matchedType(entity.node), (totals.get(matchedType(entity.node)) || 0) + 1))
    const seen = new Map<string, number>()
    return entities.flatMap(({ node, validation }) => {
      const type = matchedType(node)
      const index = (seen.get(type) || 0) + 1
      seen.set(type, index)
      const key = totals.get(type) === 1 ? type : `${type} ${index}`
      return [textField(key, clip(nameOf(node) || 'Unnamed', EVIDENCE_VALUE_LIMIT)), ...fieldCheck(key, validation, presenceOnly)]
    })
  }
  return { fields, shown: shown.length }
}

/**
 * Overview rows of the found branch (FORMATTING.md F1, F3, F12): the one matching entity keyed by
 * its matched type (never a count of 1), or the entity count when several matched, then the union
 * of missing fields as the verdict row of a field check.
 */
export const matchOverview = (checks: Checked[], matchedType: MatchedType, presenceOnly: boolean): DisplayField[] => {
  const first = checks[0]!
  const entityRow = checks.length === 1
    ? textField(matchedType(first.node), clip(nameOf(first.node) || 'Found'))
    : textField('Matching entities', checks.length)
  if (presenceOnly) return [entityRow]
  const missing = [...new Set(checks.flatMap(({ validation }) => validation.missing || []))]
  return [entityRow, textField('Missing fields', listRow(missing))]
}
