import { describe, it, expect } from 'vitest'

import { createDefaultTypeVisibility } from '@/shared/resultFilterState'
import { resultTypeOrder } from '@/shared/colors'

describe('result filter state helpers', () => {
  it('enables every known result type', () => {
    const state = createDefaultTypeVisibility()
    for (const type of resultTypeOrder) {
      expect(state[type]).toBe(true)
    }
  })

  it('returns a fresh state each time', () => {
    const first = createDefaultTypeVisibility()
    const second = createDefaultTypeVisibility()
    first.ok = false
    expect(second.ok).toBe(true)
    expect(first).not.toBe(second)
  })
})
