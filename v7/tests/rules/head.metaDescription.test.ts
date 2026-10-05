import { describe, it, expect } from 'vitest'
import { metaDescriptionRule } from '@/rules/head/metaDescription'
const run = (html: string) => metaDescriptionRule.run({ html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
describe('meta description', () => {
  it('reports missing, empty and missing-attribute cases precisely', async () => {
    const missing = await run('')
    expect(missing.type).toBe('warn'); expect(missing.priority).toBe(0)
    expect(missing.presentation?.values).toEqual([{ key: 'Meta description', value: 'Not found', kind: 'text' }])
    expect(missing.presentation?.evidence).toEqual([])
    for (const html of ['<meta name="description" content="  ">', '<meta name="description">']) {
      const r = await run(html)
      expect(r.type).toBe('warn'); expect(r.priority).toBe(100); expect(r.presentation?.values[0]).toEqual({ key: 'Characters', value: 0, kind: 'text' })
      expect(r.presentation?.values[1]).toMatchObject({ key: '<meta name="description">', value: html, kind: 'original' })
      expect(r.presentation?.markup[0].value).toBe(html)
    }
  })
  it('retains duplicate descriptions as separate full elements with actual selectors', async () => {
    const r = await run('<meta name="description" content="First"><meta name="DESCRIPTION" content="Second">')
    expect(r.type).toBe('error'); expect(r.presentation?.values[0]).toEqual({ key: 'Description elements', value: 2, kind: 'text' })
    expect(r.presentation?.values.map((f) => f.key)).toEqual(['Description elements', '<meta name="description"> 1', '<meta name="description"> 2'])
    expect(r.presentation?.markup).toHaveLength(2)
    expect(r.presentation?.evidence[1]).toEqual({ name: '<meta name="description"> 2', fields: [{ key: 'DOM path', value: 'html > head > meta:nth-of-type(2)', kind: 'path' }] })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence retained', value: 2, kind: 'text' })
  })
  it('reports a complete original element and its content separately', async () => {
    const html = '<meta name="DESCRIPTION" data-origin="cms" content="Hello world">'
    const r = await run(html)
    expect(r.type).toBe('ok'); expect(r.presentation?.values[0]).toEqual({ key: 'Characters', value: 11, kind: 'text' })
    expect(r.presentation?.values[1]).toMatchObject({ key: '<meta name="description">', value: html, kind: 'original' })
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.detailValues).toEqual([{ key: 'Markup retained', value: 1, kind: 'text' }, { key: 'Markup omitted', value: 0, kind: 'text' },
      { key: 'Evidence retained', value: 1, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' }])
    expect(r.presentation?.references).toEqual(metaDescriptionRule.meta.references)
  })
})
