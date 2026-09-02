import { describe, it, expect } from 'vitest'
import { schemaOrganizationRule } from '@/rules/schema/organization'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

const run = async (json: string) =>
  schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(`<script type="application/ld+json">${json}</script>`) } as any, { globals: {} })

describe('schema: organization', () => {
  it('passes with name, logo, and url', async () => {
    const r = await run('{"@type":"Organization","name":"Acme Corp","logo":"/logo.png","url":"https://acme.com"}')
    expect((r as any).type).toBe('ok')
  })

  it('passes with name, image instead of logo, and url', async () => {
    const r = await run('{"@type":"Organization","name":"Acme Corp","image":"/img.png","url":"https://acme.com"}')
    expect((r as any).type).toBe('ok')
  })

  it('reports missing Organization properties as recommended (info), not required (warn)', async () => {
    const r = await run('{"@type":"Organization","logo":"/logo.png","url":"https://acme.com"}')
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('name')
  })

  it('reports missing logo/image as info for Organization', async () => {
    const r = await run('{"@type":"Organization","name":"Acme Corp","url":"https://acme.com"}')
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('logo|image')
  })

  it('reports missing url as info for Organization', async () => {
    const r = await run('{"@type":"Organization","name":"Acme Corp","logo":"/logo.png"}')
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('url')
  })

  it('passes LocalBusiness with name and address', async () => {
    const r = await run('{"@type":"LocalBusiness","name":"Local Shop","address":{"@type":"PostalAddress","streetAddress":"Main St 1"}}')
    expect((r as any).type).toBe('ok')
  })

  it('warns when LocalBusiness is missing address (required per Google)', async () => {
    const r = await run('{"@type":"LocalBusiness","name":"Local Shop","logo":"/logo.png","url":"https://shop.com"}')
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('address')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
