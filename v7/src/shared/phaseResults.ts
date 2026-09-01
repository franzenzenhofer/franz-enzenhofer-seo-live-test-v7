import type { Result } from '@/core/types'

type PhasePayload = { results?: Result[] }
type PhaseEvent = { t: string; d?: unknown }

const resultsOfLast = (ev: PhaseEvent[], type: string): Result[] =>
  ((([...ev].reverse().find((e) => e.t === type))?.d as PhasePayload | undefined)?.results) || []

/**
 * Static and idle rules execute in the content script and their results ride
 * along in the DOM phase events. They are finished long before the offscreen
 * run is, so the runner publishes them up front rather than at the final merge.
 */
export const collectPhaseResults = (ev: PhaseEvent[]): Result[] => [
  ...resultsOfLast(ev, 'dom:document_end'),
  ...resultsOfLast(ev, 'dom:document_idle'),
  ...ev.filter((e) => e.t === 'dom:phase_results').flatMap((e) => (e.d as PhasePayload | undefined)?.results || []),
]
