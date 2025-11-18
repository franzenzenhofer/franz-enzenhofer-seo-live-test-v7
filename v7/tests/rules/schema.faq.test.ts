import { describe, it, expect } from 'vitest'
import { schemaFaqRule } from '@/rules/schema/faq'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: faq', () => {
  it('passes with valid FAQ', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is SEO?","acceptedAnswer":{"@type":"Answer","text":"Search Engine Optimization"}}]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('passes with multiple questions', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Q1","acceptedAnswer":{"@type":"Answer","text":"A1"}},{"@type":"Question","name":"Q2","acceptedAnswer":{"@type":"Answer","text":"A2"}}]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails with empty mainEntity', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails with no mainEntity', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage"}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

