import { describe, expect, it } from 'vitest'

import { chunkPhaseResults, PHASE_CHUNK_BYTES } from '@/content/phaseMessages'

describe('phase result messages', () => {
  it('splits bounded results into sub-32 KB chunks', () => {
    const results = Array.from({ length: 30 }, (_, index) => ({
      name: `Rule ${index}`, label: 'DOM', message: 'm'.repeat(5_000), type: 'info' as const,
      details: { evidence: Array.from({ length: 100 }, () => 'x'.repeat(2_000)) },
    }))

    const chunks = chunkPhaseResults(results)

    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(new TextEncoder().encode(JSON.stringify(chunk)).length).toBeLessThanOrEqual(PHASE_CHUNK_BYTES)
    }
  })
})
