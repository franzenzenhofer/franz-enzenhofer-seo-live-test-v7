import { describe, it, expect } from 'vitest'
import { schemaOrganizationRule } from '@/rules/schema/organization'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: organization', () => {
  it('passes with name, logo, and url', async () => {
    const json = '<script type="application/ld+json">{"@type":"Organization","name":"Acme Corp","logo":"/logo.png","url":"https://acme.com"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('passes with name, image instead of logo, and url', async () => {
    const json = '<script type="application/ld+json">{"@type":"Organization","name":"Acme Corp","image":"/img.png","url":"https://acme.com"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('works with LocalBusiness type', async () => {
    const json = '<script type="application/ld+json">{"@type":"LocalBusiness","name":"Local Shop","logo":"/logo.png","url":"https://shop.com"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Organization","logo":"/logo.png","url":"https://acme.com"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when both logo and image are missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Organization","name":"Acme Corp","url":"https://acme.com"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when url is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Organization","name":"Acme Corp","logo":"/logo.png"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

