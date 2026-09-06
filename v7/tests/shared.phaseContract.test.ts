import { describe, expect, it } from 'vitest'

import { validatePhaseMessage } from '@/shared/phaseContract'

const identity = { version: 1 as const, captureId: 'c1', url: 'https://ex.test/', capturedAt: 0 }
const facts = (extra: Record<string, unknown> = {}) => ({ phase: 'idle', nodeCount: 10, elements: [], ...extra })
const idleMessage = (extra: Record<string, unknown> = {}) =>
  ({ ...identity, phase: 'idle' as const, chunkCount: 0, facts: facts(extra) })

describe('phase message contract', () => {
  it('rejects full HTML fields', () => {
    expect(validatePhaseMessage('document_end', { html: '<html>complete page</html>' })).toEqual({
      ok: false,
      reason: 'full HTML is forbidden in phase messages',
    })
  })

  it('rejects payloads without the versioned capture identity', () => {
    expect(validatePhaseMessage('document_idle', { facts: facts() })).toEqual({
      ok: false,
      reason: 'invalid phase identity or payload',
    })
  })

  it('rejects a phase that contradicts its lifecycle event', () => {
    expect(validatePhaseMessage('document_end', idleMessage())).toEqual({
      ok: false,
      reason: 'phase does not match lifecycle event',
    })
  })

  it('rejects oversized payloads and accepts compact facts', () => {
    expect(validatePhaseMessage('document_idle', idleMessage({ value: 'x'.repeat(40_000) })).ok).toBe(false)
    expect(validatePhaseMessage('document_idle', idleMessage())).toEqual({ ok: true })
  })

  it('rejects a result chunk whose index falls outside its chunk count', () => {
    const chunk = { ...identity, phase: 'idle' as const, chunkIndex: 2, chunkCount: 2, results: [
      { ruleId: 'r', name: 'n', label: 'L', message: 'm', type: 'info' as const },
    ] }
    expect(validatePhaseMessage('phase_results', chunk).ok).toBe(false)
    expect(validatePhaseMessage('phase_results', { ...chunk, chunkIndex: 1 })).toEqual({ ok: true })
  })
})
