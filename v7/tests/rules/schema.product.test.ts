import { describe, it, expect } from 'vitest'
import { schemaProductRule } from '@/rules/schema/product'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')
// The field-check row of an entity inside its <script> record, e.g. `Article fields: Missing: headline, image`.
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => / fields$/.test(field.key) && String(field.value).startsWith('Missing: '))?.value as string | undefined

const run = async (json: string) =>
  schemaProductRule.run({ html:'', url:'https://ex.com', doc: D(`<script type="application/ld+json">${json}</script>`) } as any, { globals: {} })

describe('schema: product', () => {
  it('passes with name and a complete offer', async () => {
    const r = await run('{"@type":"Product","name":"Test Product","offers":{"price":99.99,"priceCurrency":"USD"}}')
    expect((r as any).type).toBe('ok')
    expect(r.details).toBeUndefined()
  })

  it('passes when offers is an array (common valid form)', async () => {
    const r = await run('{"@type":"Product","name":"Test Product","offers":[{"price":99.99,"priceCurrency":"USD"}]}')
    expect((r as any).type).toBe('ok')
  })

  it('passes with only aggregateRating (review|aggregateRating|offers are alternatives per Google)', async () => {
    const r = await run('{"@type":"Product","name":"Test Product","aggregateRating":{"ratingValue":4.5,"ratingCount":12}}')
    expect((r as any).type).toBe('ok')
  })

  it('passes with only review', async () => {
    const r = await run('{"@type":"Product","name":"Test Product","review":{"reviewRating":{"ratingValue":5},"author":{"name":"Jo"}}}')
    expect((r as any).type).toBe('ok')
  })

  it('accepts priceSpecification.price and AggregateOffer lowPrice', async () => {
    const withSpec = await run('{"@type":"Product","name":"P","offers":{"priceSpecification":{"price":10,"priceCurrency":"EUR"}}}')
    expect((withSpec as any).type).toBe('ok')
    const withLow = await run('{"@type":"Product","name":"P","offers":{"@type":"AggregateOffer","lowPrice":5,"priceCurrency":"EUR"}}')
    expect((withLow as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const r = await run('{"@type":"Product","offers":{"price":99.99,"priceCurrency":"USD"}}')
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('name')
  })

  it('fails when an offer has no price in any accepted form', async () => {
    const r = await run('{"@type":"Product","name":"Test Product","offers":{"priceCurrency":"USD"}}')
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('offers.price')
  })

  it('reports missing priceCurrency as info (recommended for snippets, required only for merchant listings)', async () => {
    const r = await run('{"@type":"Product","name":"Test Product","offers":{"price":99.99}}')
    expect((r as any).type).toBe('info')
    expect(missingFieldsOf(r)).toContain('offers.priceCurrency')
  })

  it('reports all missing fields', async () => {
    const r = await run('{"@type":"Product"}')
    expect((r as any).type).toBe('warn')
    const missing = missingFieldsOf(r)
    expect(missing).toContain('name')
    expect(r.details).toBeUndefined()
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaProductRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.details).toBeUndefined()
  })
})
