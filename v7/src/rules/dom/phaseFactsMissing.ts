import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

/**
 * The one overview row of a phase comparison that lacks a lifecycle observation (FORMATTING.md F13):
 * the checked input is `Not captured` and exactly one row names what is missing.
 */
export const PHASE_FACTS_MISSING_INPUT = 'Not captured'

export const phaseFactsMissingRow = (staticFacts: unknown, idleFacts: unknown): DisplayField => {
  const missing = [staticFacts ? null : 'Static DOM', idleFacts ? null : 'Idle DOM'].filter((name): name is string => name !== null)
  return textField(missing.length === 1 ? `${missing[0]} facts` : 'DOM facts', PHASE_FACTS_MISSING_INPUT)
}
