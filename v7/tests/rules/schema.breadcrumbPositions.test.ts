import { describe, expect, it } from 'vitest'

import { schemaBreadcrumbPositionsRule } from '@/rules/schema/breadcrumbPositions'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('schema: breadcrumb positions', () => {
  it('passes when positions and items are present', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"item\":{\"@id\":\"https://ex.com/\",\"name\":\"Home\"}},{\"@type\":\"ListItem\",\"position\":\"2\",\"item\":\"https://ex.com/page\"}]}</script>'
    const r = await schemaBreadcrumbPositionsRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('warns when positions or items are missing', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"item\":{\"@id\":\"https://ex.com/\"}}]}</script>'
    const r = await schemaBreadcrumbPositionsRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('warn')
  })
})
