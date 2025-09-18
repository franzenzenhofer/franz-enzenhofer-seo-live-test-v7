import { describe, it, expect } from 'vitest'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { schemaArticleRequiredRule } from '@/rules/schema/articleRequired'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: article', () => {
  it('validates presence and required fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"H","datePublished":"2024-01-01","image":"/a.jpg","author":{"name":"A"}}</script>'
    const p = { html:'', url:'https://ex.com', doc: D(json) } as any
    const r1 = await schemaArticlePresentRule.run(p, { globals: {} })
    const r2 = await schemaArticleRequiredRule.run(p, { globals: {} })
    expect((r1 as any).type).toBe('ok')
    expect((r2 as any).type).toBe('ok')
  })
})
