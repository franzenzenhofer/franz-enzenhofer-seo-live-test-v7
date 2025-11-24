import { describe, it, expect } from 'vitest'
import { brandInTitleRule } from '@/rules/head/brandInTitle'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: brand in title', () => {
  it('notes missing config', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'', doc: doc('<title>Shop</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('finds brand when configured', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'', doc: doc('<title>Shop ACME</title>') }, { globals: { variables: { brand: 'acme' } } })
    expect((r as any).type).toBe('ok')
  })
})
