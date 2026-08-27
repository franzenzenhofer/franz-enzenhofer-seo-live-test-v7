import { describe, expect, it } from 'vitest'

import { validatePhaseMessage } from '@/shared/phaseContract'

describe('phase message contract', () => {
  it('rejects full HTML fields', () => {
    expect(validatePhaseMessage('document_end', { html: '<html>complete page</html>' })).toEqual({
      ok: false,
      reason: 'full HTML is forbidden in phase messages',
    })
  })

  it('rejects oversized payloads and accepts compact facts', () => {
    expect(validatePhaseMessage('document_idle', { facts: { value: 'x'.repeat(40_000) } }).ok).toBe(false)
    expect(validatePhaseMessage('document_idle', { facts: { nodeCount: 100_000 } })).toEqual({ ok: true })
  })
})
