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
    expect(r.presentation?.values).toEqual([{ key: 'Meta keywords', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.noMarkup).toBe('No meta keywords element found')
  })

  it('retains the complete source tag and sampled keyword values', async () => {
    const html = '<meta name="keywords" data-source="cms" content="seo, search">'
    const r = await run(html)

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(650)
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.values).toEqual([{ key: 'Keywords', value: 'seo, search', kind: 'text' },
      { key: '<meta name="keywords">', value: html, kind: 'original', fidelity: 'complete-original' }])
    expect(r.presentation?.detailValues).toEqual([{ key: 'Keyword tokens', value: 2, kind: 'text' }, { key: 'Markup retained', value: 1, kind: 'text' },
      { key: 'Markup omitted', value: 0, kind: 'text' }, { key: 'Evidence retained', value: 1, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' }])
    expect(r.presentation?.evidence).toEqual([{ name: '<meta name="keywords">', fields: [{ key: 'DOM path', value: 'html > head > meta', kind: 'path' }] }])
  })

  it('warns for an empty tag while preserving the empty token count', async () => {
    const r = await run('<meta name="keywords" content="   ">')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(650)
    expect(r.presentation?.values[0]).toEqual({ key: 'Keywords', value: 'None', kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Keyword tokens', value: 0, kind: 'text' })
  })

  it('warns for multiple tags and retains each sampled element', async () => {
    const html = '<meta name="keywords" content="one"><meta name="keywords" content="two">'
    const r = await run(html)

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values.map((f) => f.key)).toEqual(['Meta keywords tags', '<meta name="keywords"> 1', '<meta name="keywords"> 2'])
    expect(r.presentation?.values[0]).toEqual({ key: 'Meta keywords tags', value: 2, kind: 'text' })
    expect(r.presentation?.markup.map(({ value }) => value).join('')).toBe(html)
  })

  it('reports omitted source tags without changing the total count', async () => {
    const r = await run(Array.from({ length: 12 }, (_, index) => `<meta name="keywords" content="keyword-${index}">`).join(''))

    expect(r.presentation?.values).toContainEqual({ key: 'Meta keywords tags', value: 12, kind: 'text' })
    expect(r.presentation?.values.map((f) => f.key)).toEqual(['Meta keywords tags'])
    expect(r.presentation?.markup).toHaveLength(10); expect(r.presentation?.evidence).toHaveLength(10)
    expect(r.presentation?.detailValues).toEqual([{ key: 'Markup retained', value: 10, kind: 'text' }, { key: 'Markup omitted', value: 2, kind: 'text' },
      { key: 'Evidence retained', value: 10, kind: 'text' }, { key: 'Evidence omitted', value: 2, kind: 'text' }])
  })

  it('summarizes long keyword lists within the overview budget and states the rest', async () => {
    const content = Array.from({ length: 30 }, (_, index) => `keyword-number-${index}`).join(', ')
    const r = await run(`<meta name="keywords" content="${content}">`)
    const summary = r.presentation?.values[0]
    expect(summary?.key).toBe('Keywords'); expect(String(summary?.value).length).toBeLessThanOrEqual(60)
    expect(summary?.value).toBe('keyword-number-0, keyword-number-1 … 28 more')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Keyword tokens', value: 30, kind: 'text' })
  })

  it('keeps both documentation references and removes the legacy details payload', async () => {
    const r = await run('<meta name="keywords" content="seo">')

    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
