import type { DomPhaseFacts } from '@/shared/domFacts.types'

/**
 * Builds a phase completion message exactly as content/domCapture.ts sends it
 * (wire version 1, capture identity, chunk count). Tests must exercise the real
 * protocol - never a looser shape than production validates.
 */
export const phaseCompletion = (facts: DomPhaseFacts, url = 'https://ex.test/') => ({
  version: 1 as const,
  captureId: 'capture-test-1',
  phase: facts.phase,
  url,
  capturedAt: 0,
  chunkCount: 0,
  facts,
  baseUri: facts.baseUri,
  navTiming: null,
})

export const phaseEvent = (facts: DomPhaseFacts) =>
  facts.phase === 'static' ? 'document_end' : 'document_idle'
