import { describe, expect, it } from 'vitest'

import { schemaBreadcrumbPositionsRule } from '@/rules/schema/breadcrumbPositions'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

const run = async (json: string) =>
  schemaBreadcrumbPositionsRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })

describe('schema: breadcrumb positions', () => {
  it('passes when positions, names, and items are present', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https://ex.com/","name":"Home"}},{"@type":"ListItem","position":"2","name":"Page","item":"https://ex.com/page"}]}</script>'
    const r = await run(json)
    expect(r.type).toBe('ok')
  })

  it('passes when the last crumb has a name but no item (Google: item not required on the last ListItem)', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://ex.com/"},{"@type":"ListItem","position":2,"name":"Current Page"}]}</script>'
    const r = await run(json)
    expect(r.type).toBe('ok')
  })

  it('warns when a non-final crumb is missing its item', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home"},{"@type":"ListItem","position":2,"name":"Page","item":"https://ex.com/page"}]}</script>'
    const r = await run(json)
    expect(r.type).toBe('warn')
    expect((r as any).message).toContain('itemListElement[0].item')
  })

  it('warns when a ListItem has no name anywhere', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https://ex.com/"}},{"@type":"ListItem","position":2,"name":"Page"}]}</script>'
    const r = await run(json)
    expect(r.type).toBe('warn')
    expect((r as any).message).toContain('itemListElement[0].name')
  })

  it('warns when positions are missing or not positive integers', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":0,"name":"Home","item":"https://ex.com/"},{"@type":"ListItem","position":1.5,"name":"Page"}]}</script>'
    const r = await run(json)
    expect(r.type).toBe('warn')
    expect((r as any).message).toContain('itemListElement[0].position')
    expect((r as any).message).toContain('itemListElement[1].position')
  })

  it('warns when position and name are missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","item":{"@id":"https://ex.com/"}}]}</script>'
    const r = await run(json)
    expect(r.type).toBe('warn')
  })
})
