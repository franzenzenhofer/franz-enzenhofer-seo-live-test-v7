import { describe, it, expect } from 'vitest'
import { schemaBreadcrumbRule } from '@/rules/schema/breadcrumb'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: breadcrumb', () => {
  it('needs >=2 itemListElement', async () => {
    const json = '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"A","item":"https://ex.com"},{"@type":"ListItem","position":2,"name":"B","item":"https://ex.com/b"}]}</script>'
    const r = await schemaBreadcrumbRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

