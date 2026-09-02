import { describe, it, expect } from 'vitest'
import { schemaFaqRule } from '@/rules/schema/faq'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: faq', () => {
  it('reports complete FAQ as info because Google retired the FAQ rich result', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is SEO?","acceptedAnswer":{"@type":"Answer","text":"Search Engine Optimization"}}]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('retired')
  })

  it('accepts a single Question object as mainEntity without throwing', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":{"@type":"Question","name":"Q1","acceptedAnswer":{"@type":"Answer","text":"A1"}}}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).not.toContain('missing')
  })

  it('reports incomplete FAQ (empty mainEntity) as info, not warn', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('mainEntity Question with acceptedAnswer')
  })

  it('reports missing mainEntity as info, not warn', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage"}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
