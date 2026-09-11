import { describe, it, expect } from 'vitest'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { schemaArticleRequiredRule } from '@/rules/schema/articleRequired'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => field.key === 'Missing fields')?.value as string | undefined

describe('schema: article present', () => {
  it('detects Article type', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article"}</script>'
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect(r.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Matching entities', value: 1 }))
    expect(r.details).toBeUndefined()
  })

  it('detects NewsArticle type', async () => {
    const json = '<script type="application/ld+json">{"@type":"NewsArticle"}</script>'
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect(r.details).toBeUndefined()
  })

  it('detects BlogPosting type', async () => {
    const json = '<script type="application/ld+json">{"@type":"BlogPosting"}</script>'
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect(r.details).toBeUndefined()
  })

  it('skips when no article schema present', async () => {
    const r = await schemaArticlePresentRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Matching entities', value: 0 }))
    expect(r.presentation?.noMarkup).toBe('No JSON-LD scripts found')
    expect(r.details).toBeUndefined()
  })
})

describe('schema: article required', () => {
  it('passes with all recommended fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test Headline","datePublished":"2024-01-01","dateModified":"2024-01-02","image":"/img.jpg","author":{"name":"John Doe"}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect(r.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Entity fields', value: 'recommended fields' }))
    expect(r.details).toBeUndefined()
  })

  it('reports datePublished independently of dateModified', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","dateModified":"2024-01-01","image":"/img.jpg","author":{"name":"John"}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('datePublished')
    expect(missingFieldsOf(r)).not.toContain('dateModified')
  })

  it('reports dateModified independently of datePublished', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","image":"/img.jpg","author":{"name":"John"}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('dateModified')
  })

  it('accepts author as string', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","dateModified":"2024-01-02","image":"/img.jpg","author":"John Doe"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect(r.details).toBeUndefined()
  })

  it('fails when headline is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","datePublished":"2024-01-01","dateModified":"2024-01-02","image":"/img.jpg","author":"John"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('headline')
  })

  it('fails when both dates are missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","image":"/img.jpg","author":"John"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('datePublished')
    expect(missingFieldsOf(r)).toContain('dateModified')
  })

  it('fails when image is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","dateModified":"2024-01-02","author":"John"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('image')
  })

  it('fails when author.name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article","headline":"Test","datePublished":"2024-01-01","dateModified":"2024-01-02","image":"/img.jpg","author":{}}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(missingFieldsOf(r)).toContain('author.name')
  })

  it('reports all missing fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"Article"}</script>'
    const r = await schemaArticleRequiredRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    const missing = missingFieldsOf(r)
    expect(missing).toContain('headline')
    expect(missing).toContain('datePublished')
    expect(missing).toContain('dateModified')
    expect(missing).toContain('image')
    expect(missing).toContain('author.name')
    expect(r.details).toBeUndefined()
  })
})
