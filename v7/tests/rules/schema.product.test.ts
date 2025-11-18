import { describe, it, expect } from 'vitest'
import { schemaProductRule } from '@/rules/schema/product'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: product', () => {
  it('passes with all required fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Product","name":"Test Product","offers":{"price":99.99,"priceCurrency":"USD"}}</script>'
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Product","offers":{"price":99.99,"priceCurrency":"USD"}}</script>'
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('name')
  })

  it('fails when offers.price is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Product","name":"Test Product","offers":{"priceCurrency":"USD"}}</script>'
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('offers.price')
  })

  it('fails when offers.priceCurrency is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Product","name":"Test Product","offers":{"price":99.99}}</script>'
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('offers.priceCurrency')
  })

  it('reports all missing fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Product"}</script>'
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('missing')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

