import { describe, it, expect } from 'vitest'
import { brandInTitleRule } from '@/rules/head/brandInTitle'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: brand in title', () => {
  it('warns when inferred brand is missing from title', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'https://example.com', doc: doc('<title>Shop</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message.toLowerCase()).toContain('brand')
  })

  it('passes when inferred brand is present', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'https://example.com', doc: doc('<title>Shop Example</title>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('uses configured brand when provided', async () => {
    const r = await brandInTitleRule.run({ html:'', url:'https://example.com', doc: doc('<title>Shop ACME</title>') }, { globals: { variables: { brand: 'acme' } } })
    expect((r as any).type).toBe('info')
  })
})

it('retains exact title markup and separates plain text from source', async () => {
  const html = '<title lang="de" data-template="trip">Shop ACME</title>'
  const r = await brandInTitleRule.run({ html, url: 'https://example.com', doc: doc(html) }, { globals: { variables: { brand: 'ACME' } } })
  expect(r.presentation?.markup[0].value).toBe(html)
  expect(r.presentation?.detailValues).toContainEqual({ key: 'Title', value: 'Shop ACME', kind: 'text' })
  expect(r.presentation?.references).toEqual(brandInTitleRule.meta.references)
})
it('does not claim a missing title was searched or stringify invalid brand configuration', async () => {
  const absent = await brandInTitleRule.run({ html: '', url: 'https://example.com', doc: doc('') }, { globals: {} })
  expect(absent.presentation?.values[0].value).toBe('Not evaluated')
  const invalid = await brandInTitleRule.run({ html: '', url: 'https://example.com', doc: doc('<title>Example</title>') }, { globals: { variables: { brand: {} } } })
  expect(invalid.type).toBe('runtime_error')
  expect(JSON.stringify(invalid)).not.toContain('[object Object]')
})
