import { describe, it, expect } from 'vitest'
import { schemaEventRule } from '@/rules/schema/event'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => field.key === 'Missing fields')?.value as string | undefined

describe('schema: event', () => {
  it('passes with all required fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Event","name":"Concert Night","startDate":"2024-06-15","location":{"@type":"Place","name":"Music Hall"}}</script>'
    const r = await schemaEventRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect(r.details).toBeUndefined()
  })

  it('fails when name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Event","startDate":"2024-06-15","location":{"@type":"Place","name":"Music Hall"}}</script>'
    const r = await schemaEventRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('name')
  })

  it('fails when startDate is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Event","name":"Concert","location":{"@type":"Place","name":"Music Hall"}}</script>'
    const r = await schemaEventRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('startDate')
  })

  it('fails when location is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Event","name":"Concert","startDate":"2024-06-15"}</script>'
    const r = await schemaEventRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('location')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaEventRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.details).toBeUndefined()
  })
})
