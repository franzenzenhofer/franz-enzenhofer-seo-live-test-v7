import { describe, expect, it } from 'vitest'

import { registry } from '@/rules/registry'

describe('rule input contract', () => {
  it('assigns an explicit input to every registered rule', () => {
    const missing = registry.filter((rule) => !rule.input).map((rule) => rule.id)
    expect(missing).toEqual([])
  })

  it('uses only supported input phases', () => {
    const supported = new Set(['static', 'idle', 'compare', 'context'])
    expect(registry.every((rule) => supported.has(String(rule.input)))).toBe(true)
  })
})
