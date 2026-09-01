import { describe, it, expect } from 'vitest'

import { collectPhaseResults } from '@/shared/phaseResults'

const chunk = (phase: string, ids: string[]) => ({
  t: 'dom:phase_results',
  d: { phase, results: ids.map((id) => ({ ruleId: id, name: id, type: 'ok', message: 'm' })) },
})

describe('collectPhaseResults', () => {
  it('gathers every static and idle chunk the content script sent', () => {
    // Real page measured: static arrives in 3 chunks, idle in 2.
    const ev = [
      { t: 'nav:commit' },
      chunk('static', ['s1', 's2']),
      chunk('static', ['s3']),
      { t: 'dom:document_end', d: { facts: {} } },
      chunk('idle', ['i1', 'i2']),
      { t: 'dom:document_idle', d: { facts: {} } },
    ]
    const out = collectPhaseResults(ev)
    expect(out.map((r) => r.ruleId)).toEqual(['s1', 's2', 's3', 'i1', 'i2'])
  })

  it('returns nothing when no phase ran', () => {
    expect(collectPhaseResults([{ t: 'nav:commit' }])).toEqual([])
  })
})
