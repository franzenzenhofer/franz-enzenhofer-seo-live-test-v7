import type { EventRec } from './types'

type PhaseData = { version?: number; captureId?: string; phase?: string; chunkIndex?: number; chunkCount?: number }

export const phaseEventState = (events: EventRec[], event: EventRec): 'new' | 'duplicate' | 'invalid' => {
  if (!event.t.startsWith('dom:')) return 'new'
  const data = event.d as PhaseData | undefined
  if (data?.version !== 1) return 'new'
  const sameCapture = events.filter((entry) => (entry.d as PhaseData | undefined)?.captureId === data.captureId)
  if (sameCapture.some((entry) => entry.t === event.t && (entry.d as PhaseData).chunkIndex === data.chunkIndex)) return 'duplicate'
  if (events.some((entry) => entry.t === event.t && entry.t !== 'dom:phase_results')) return 'invalid'
  if (sameCapture.some((entry) => {
    const prior = entry.d as PhaseData
    return prior.phase !== data.phase || prior.chunkCount !== data.chunkCount
  })) return 'invalid'
  const chunks = sameCapture.filter((entry) => entry.t === 'dom:phase_results')
  if (event.t === 'dom:phase_results') return data.chunkIndex === chunks.length ? 'new' : 'invalid'
  return chunks.length === data.chunkCount ? 'new' : 'invalid'
}
