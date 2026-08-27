import { describe, expect, it } from 'vitest'

import { boundResult, RESULT_LIMITS } from '@/shared/boundResult'

describe('result bounds', () => {
  it('preserves core findings while bounding message, details, and evidence', () => {
    const result = boundResult({
      name: 'Large result', label: 'DOM', message: 'm'.repeat(10_000), type: 'warn',
      details: { evidence: Array.from({ length: 100 }, (_, index) => ({ index, html: 'x'.repeat(10_000) })) },
    })

    expect(result.message).toHaveLength(RESULT_LIMITS.message)
    expect((result.details?.['evidence'] as unknown[]).length).toBe(RESULT_LIMITS.array)
    expect(result.details?.['evidenceBounds']).toEqual({ evidence: { total: 100, shown: 10, truncated: true } })
    expect(new TextEncoder().encode(JSON.stringify(result.details)).length).toBeLessThanOrEqual(RESULT_LIMITS.detailsBytes)
  })
})
