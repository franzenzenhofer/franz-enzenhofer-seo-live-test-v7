import type { DisplayField, Presentation } from '@/shared/presentation/schema'

import type { RuleRun } from './harness'
import { COUNT_KEYS as SOURCE_COUNT_KEYS } from '@/shared/presentation/counts'

export type Violation = { ruleId: string; fixture: string; detail: string }
export type Check = { id: string; title: string; run: (view: Presentation, run: RuleRun, doc: Document) => string[] }

export const MAX_OVERVIEW_KEY = 20
export const MAX_DETAIL_KEY = 32
export const ABSENCE = new Set(['Not found', 'Absent', 'Not declared', 'Not captured', 'Not checked', 'None', 'Request failed'])
export const COUNT_KEYS: readonly string[] = SOURCE_COUNT_KEYS
export const text = (field: DisplayField) => String(field.value)
export const isOriginal = (field: DisplayField) => field.kind === 'original'
export const numberOf = (fields: DisplayField[], key: string) => {
  const value = fields.find((field) => field.key === key)?.value
  return typeof value === 'number' ? value : undefined
}
