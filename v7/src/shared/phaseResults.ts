import type { Result } from '@/core/types'

type PhasePayload = { results?: Result[]; captureId?: string; chunkCount?: number; chunkIndex?: number }
type PhaseEvent = { t: string; d?: unknown }

const payloadOf = (event?: PhaseEvent) => event?.d as PhasePayload | undefined
const lastOf = (ev: PhaseEvent[], type: string) => [...ev].reverse().find((e) => e.t === type)

/**
 * Result chunks only count when the WHOLE capture arrived: the content script
 * sends every chunk before its completion message, so a capture whose chunk set
 * is short was cut off. Matching on captureId also keeps a re-capture of the
 * same document from merging its chunks with the previous one's.
 */
const completeChunkResults = (ev: PhaseEvent[], captureId?: string, chunkCount?: number): Result[] => {
  if (!captureId || !chunkCount) return []
  const chunks = ev.filter((e) => e.t === 'dom:phase_results' && payloadOf(e)?.captureId === captureId)
  const indices = new Set(chunks.map((e) => payloadOf(e)?.chunkIndex))
  if (chunks.length !== chunkCount || indices.size !== chunkCount) return []
  return chunks.flatMap((e) => payloadOf(e)?.results || [])
}

/**
 * Static and idle rules execute in the content script and their results ride
 * along in the DOM phase events. They are finished long before the offscreen
 * run is, so the runner publishes them up front rather than at the final merge.
 */
export const collectPhaseResults = (ev: PhaseEvent[]): Result[] =>
  ['dom:document_end', 'dom:document_idle'].flatMap((type) => {
    const data = payloadOf(lastOf(ev, type))
    return [...(data?.results || []), ...completeChunkResults(ev, data?.captureId, data?.chunkCount)]
  })
