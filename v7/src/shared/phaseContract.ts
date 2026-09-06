export const PHASE_MESSAGE_BYTES = 32_000
const PHASE_EVENTS = new Set(['document_end', 'document_idle', 'phase_results'])

export type PhaseContractResult = { ok: true } | { ok: false; reason: string }

export const validatePhaseMessage = (event: string, data: unknown): PhaseContractResult => {
  if (!PHASE_EVENTS.has(event)) return { ok: false, reason: `unsupported phase event: ${event}` }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'phase data must be an object' }
  if (Object.prototype.hasOwnProperty.call(data, 'html')) return { ok: false, reason: 'full HTML is forbidden in phase messages' }
  const parsed = (event === 'phase_results' ? phaseChunkSchema : phaseCompleteSchema).safeParse(data)
  if (!parsed.success) return { ok: false, reason: 'invalid phase identity or payload' }
  if (event !== 'phase_results' && parsed.data.phase !== (event === 'document_end' ? 'static' : 'idle')) {
    return { ok: false, reason: 'phase does not match lifecycle event' }
  }
  const bytes = new TextEncoder().encode(JSON.stringify({ event, data })).length
  return bytes <= PHASE_MESSAGE_BYTES
    ? { ok: true }
    : { ok: false, reason: `phase message exceeds ${PHASE_MESSAGE_BYTES} bytes` }
}
import { phaseChunkSchema, phaseCompleteSchema } from './phaseSchema'
