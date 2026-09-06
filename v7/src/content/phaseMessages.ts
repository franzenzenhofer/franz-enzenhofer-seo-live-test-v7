import { boundResults } from '@/shared/boundResult'
import type { Result } from '@/core/types'
import type { PhaseIdentity } from '@/shared/phaseSchema'

export const PHASE_CHUNK_BYTES = 20_000
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length

export const chunkPhaseResults = (results: Result[], limit = PHASE_CHUNK_BYTES): Result[][] => {
  const chunks: Result[][] = []
  let current: Result[] = []
  for (const result of boundResults(results)) {
    if (current.length && bytes([...current, result]) > limit) {
      chunks.push(current)
      current = []
    }
    current.push(result)
  }
  if (current.length) chunks.push(current)
  return chunks
}

export const sendPhaseResults = async (identity: PhaseIdentity, results: Result[]) => {
  const chunks = chunkPhaseResults(results)
  for (const [chunkIndex, chunk] of chunks.entries()) {
    const response = await chrome.runtime.sendMessage({
      event: 'phase_results', data: { ...identity, chunkIndex, chunkCount: chunks.length, results: chunk },
    }) as { accepted?: boolean } | undefined
    if (!response?.accepted) throw new Error('Phase result capture rejected')
  }
  return chunks.length
}
