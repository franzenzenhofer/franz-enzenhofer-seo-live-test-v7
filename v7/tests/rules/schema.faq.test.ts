import { describe, it, expect } from 'vitest'
import { schemaFaqRule } from '@/rules/schema/faq'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: faq', () => {
  it('needs questions and acceptedAnswer', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Q","acceptedAnswer":{"@type":"Answer","text":"A"}}]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

