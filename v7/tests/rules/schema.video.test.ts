import { describe, it, expect } from 'vitest'
import { schemaVideoRule } from '@/rules/schema/video'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: video', () => {
  it('needs name description thumbnailUrl uploadDate', async () => {
    const json = '<script type="application/ld+json">{"@type":"VideoObject","name":"N","description":"D","thumbnailUrl":"https://ex.com/t.jpg","uploadDate":"2024-01-01"}</script>'
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

