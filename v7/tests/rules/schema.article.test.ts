import { describe, it, expect } from 'vitest'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { schemaArticleRequiredRule } from '@/rules/schema/articleRequired'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: article present', () => {
  it('detects Article type', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article"}</script>'
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('detects NewsArticle type', async () => {
    const json = '<script type="application/ld+json">{"@type":"NewsArticle"}</script>'
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('detects BlogPosting type', async () => {
    const json = '<script type="application/ld+json">{"@type":"BlogPosting"}</script>'
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('skips when no article schema present', async () => {
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

describe('schema: article required', () => {
  it('passes with all required fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test Headline","datePublished":"2024-01-01","image":"/img.jpg","author":{"name":"John Doe"}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('accepts dateModified instead of datePublished', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","dateModified":"2024-01-01","image":"/img.jpg","author":{"name":"John"}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('accepts author as string', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","image":"/img.jpg","author":"John Doe"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when headline is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","datePublished":"2024-01-01","image":"/img.jpg","author":"John"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('headline')
  })

  it('fails when both dates are missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","image":"/img.jpg","author":"John"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('datePublished|dateModified')
  })

  it('fails when image is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","author":"John"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('image')
  })

  it('fails when author.name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","image":"/img.jpg","author":{}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('author.name')
  })

  it('reports all missing fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('missing')
  })
})
