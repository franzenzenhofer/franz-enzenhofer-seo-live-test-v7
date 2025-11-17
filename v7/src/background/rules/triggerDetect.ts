/**
 * Trigger detection for run state tracking
 */

import type { TriggerReason } from './runState'

/**
 * Determine trigger reason from event list
 */
export const determineTrigger = (events: Array<{ t: string }>): TriggerReason => {
  const types = events.map((e) => e.t)
  if (types.some((t) => t === 'nav:before')) return 'nav:before'
  if (types.some((t) => t === 'nav:commit')) return 'nav:commit'
  if (types.some((t) => t === 'nav:history')) return 'nav:history'
  if (types.some((t) => t === 'dom:document_idle')) return 'dom:idle'
  return 'auto'
}
