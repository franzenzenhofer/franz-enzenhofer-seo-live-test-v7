import { describe, it, expect } from 'vitest'
import { schemaProductRule } from '@/rules/schema/product'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: product', () => {
  it('requires name and offers.price/currency', async () => {
    const json = '<script type="application/ld+json">{"@type":"Product","name":"P","offers":{"price":10,"priceCurrency":"USD"}}</script>'
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

