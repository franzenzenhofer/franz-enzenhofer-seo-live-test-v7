import { describe, it, expect } from 'vitest'
import { brandInTitleRule } from '@/rules/head/brandInTitle'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: brand in title', () => {
  it('warns when inferred brand is missing from title', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'https://example.com', doc: doc('<title>Shop</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message.toLowerCase()).toContain('brand')
  })

  it('passes when inferred brand is present', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'https://example.com', doc: doc('<title>Shop Example</title>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('uses configured brand when provided', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'https://example.com', doc: doc('<title>Shop ACME</title>') }, { globals: { variables: { brand: 'acme' } } })
    expect((r as any).type).toBe('info')
  })
})
