import { describe, it, expect } from 'vitest'
import { schemaHowToRule } from '@/rules/schema/howto'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: howto', () => {
  it('passes with name and steps', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Bake Cookies","step":[{"@type":"HowToStep","text":"Preheat oven"},{"@type":"HowToStep","text":"Mix ingredients"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('passes with single step', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Start","step":[{"@type":"HowToStep","text":"Begin"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","step":[{"@type":"HowToStep","text":"Step 1"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when steps are missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Cook"}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('passes with empty steps array', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Cook","step":[]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

