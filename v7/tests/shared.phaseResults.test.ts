import { describe, it, expect } from 'vitest'

import { collectPhaseResults } from '@/shared/phaseResults'

const results = (ids: string[]) => ids.map((id) => ({ ruleId: id, name: id, type: 'ok', message: 'm' }))
const chunk = (captureId: string, phase: string, chunkIndex: number, chunkCount: number, ids: string[]) => ({
  t: 'dom:phase_results',
  d: { version: 1, captureId, phase, chunkIndex, chunkCount, results: results(ids) },
})
const completion = (captureId: string, phase: string, chunkCount: number) => ({
  t: phase === 'static' ? 'dom:document_end' : 'dom:document_idle',
  d: { version: 1, captureId, phase, chunkCount, facts: {} },
})

describe('collectPhaseResults', () => {
  it('gathers every static and idle chunk the content script sent', () => {
    // Real page measured: static arrives in 2 chunks, idle in 1.
    const ev = [
      { t: 'nav:commit' },
      chunk('cap-static', 'static', 0, 2, ['s1', 's2']),
      chunk('cap-static', 'static', 1, 2, ['s3']),
      completion('cap-static', 'static', 2),
      chunk('cap-idle', 'idle', 0, 1, ['i1', 'i2']),
      completion('cap-idle', 'idle', 1),
    ]
    expect(collectPhaseResults(ev).map((r) => r.ruleId)).toEqual(['s1', 's2', 's3', 'i1', 'i2'])
  })

  it('drops a capture whose chunks did not all arrive', () => {
    // Chunk 1 of 2 was lost: publishing chunk 0 alone would silently present a
    // partial phase as the whole one.
    const ev = [
      chunk('cap-static', 'static', 0, 2, ['s1']),
      completion('cap-static', 'static', 2),
    ]
    expect(collectPhaseResults(ev)).toEqual([])
  })

  it('never merges chunks from a previous capture of the same phase', () => {
    const ev = [
      chunk('cap-old', 'static', 0, 1, ['old']),
      completion('cap-old', 'static', 1),
      chunk('cap-new', 'static', 0, 1, ['new']),
      completion('cap-new', 'static', 1),
    ]
    expect(collectPhaseResults(ev).map((r) => r.ruleId)).toEqual(['new'])
  })

  it('returns nothing when no phase ran', () => {
    expect(collectPhaseResults([{ t: 'nav:commit' }])).toEqual([])
  })
})
