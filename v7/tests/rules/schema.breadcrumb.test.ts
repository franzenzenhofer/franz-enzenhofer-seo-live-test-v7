import { describe, it, expect } from 'vitest'
import { schemaBreadcrumbRule } from '@/rules/schema/breadcrumb'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: breadcrumb', () => {
  it('passes with 2 breadcrumb items', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://ex.com"},{"@type":"ListItem","position":2,"name":"Products","item":"https://ex.com/products"}]}</script>'
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('passes with 3 breadcrumb items', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home"},{"@type":"ListItem","position":2,"name":"Products"},{"@type":"ListItem","position":3,"name":"Shoes"}]}</script>'
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails with only 1 breadcrumb item', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home"}]}</script>'
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails with empty itemListElement', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>'
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails with no itemListElement', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList"}</script>'
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

