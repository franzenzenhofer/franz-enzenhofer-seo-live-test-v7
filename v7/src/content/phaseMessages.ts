import { boundResults } from '@/shared/boundResult'
import type { Result } from '@/core/types'

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

export const sendPhaseResults = async (phase: 'static' | 'idle', url: string, results: Result[]) => {
  for (const chunk of chunkPhaseResults(results)) {
    await chrome.runtime.sendMessage({ event: 'phase_results', data: { phase, url, results: chunk } })
  }
}
