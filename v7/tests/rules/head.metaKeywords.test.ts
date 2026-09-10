import { describe, expect, it } from 'vitest'

import { metaKeywordsRule as rule } from '@/rules/head/metaKeywords'

const run = (html: string) => rule.run({
  html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} })

describe('meta keywords', () => {
  it('reports absence as information with the idle input and no markup', async () => {
    const r = await run('<p>No keywords</p>')

    expect(r.type).toBe('info')
    expect(r.priority).toBe(980)
    expect(r.presentation?.input).toBe('Idle DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Meta keywords tags', value: 0, kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No meta keywords element found')
  })

  it('retains the complete source tag and sampled keyword values', async () => {
    const html = '<meta name="keywords" data-source="cms" content="seo, search">'
    const r = await run(html)

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(650)
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Content (trimmed)', value: 'seo, search', kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Keyword samples (trimmed)', value: 'seo, search', kind: 'text' })
  })

  it('warns for an empty tag while preserving the empty token count', async () => {
    const r = await run('<meta name="keywords" content="   ">')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(650)
    expect(r.presentation?.values).toContainEqual({ key: 'Keyword tokens', value: 0, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Content (trimmed)', value: 'Empty', kind: 'text' })
  })

  it('warns for multiple tags and retains each sampled element', async () => {
    const html = '<meta name="keywords" content="one"><meta name="keywords" content="two">'
    const r = await run(html)

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({ key: 'Meta keywords tags', value: 2, kind: 'text' })
    expect(r.presentation?.markup.map(({ value }) => value).join('')).toBe(html)
  })

  it('reports omitted source tags without changing the total count', async () => {
    const r = await run(Array.from({ length: 12 }, (_, index) => `<meta name="keywords" content="keyword-${index}">`).join(''))

    expect(r.presentation?.values).toContainEqual({ key: 'Meta keywords tags', value: 12, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Elements omitted', value: 2, kind: 'text' })
  })

  it('keeps both documentation references and removes the legacy details payload', async () => {
    const r = await run('<meta name="keywords" content="seo">')

    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
