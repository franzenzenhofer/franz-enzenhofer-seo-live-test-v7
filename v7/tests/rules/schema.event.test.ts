import { describe, it, expect } from 'vitest'
import { schemaEventRule } from '@/rules/schema/event'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: event', () => {
  it('needs name startDate location', async () => {
    const json = '<script type="application/ld+json">{"@type":"Event","name":"E","startDate":"2024-01-01","location":{"@type":"Place","name":"P"}}</script>'
    const r = await schemaEventRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

