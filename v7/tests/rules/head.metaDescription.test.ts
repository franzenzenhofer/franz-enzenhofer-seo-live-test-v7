import { describe, it, expect } from 'vitest'
import { metaDescriptionRule } from '@/rules/head/metaDescription'
const run = (html: string) => metaDescriptionRule.run({ html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
describe('meta description', () => {
  it('reports missing, empty and missing-attribute cases precisely', async () => {
    const missing = await run('')
    expect(missing.type).toBe('warn'); expect(missing.presentation?.values[0].value).toBe(0)
    for (const html of ['<meta name="description" content="  ">', '<meta name="description">']) {
      const r = await run(html)
      expect(r.type).toBe('warn'); expect(r.presentation?.values[1].value).toBe(0)
      expect(r.presentation?.markup[0].value).toBe(html)
    }
  })
  it('retains duplicate descriptions as separate full elements with actual selectors', async () => {
    const r = await run('<meta name="description" content="First"><meta name="DESCRIPTION" content="Second">')
    expect(r.type).toBe('error'); expect(r.presentation?.values[0].value).toBe(2)
    expect(r.presentation?.markup).toHaveLength(2)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'DOM path 2', value: 'html > head > meta:nth-of-type(2)', kind: 'path' })
  })
  it('reports a complete original element and its content separately', async () => {
    const html = '<meta name="DESCRIPTION" data-origin="cms" content="Hello world">'
    const r = await run(html)
    expect(r.type).toBe('ok'); expect(r.presentation?.values[1].value).toBe(11)
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.detailValues[0].value).toBe('Hello world')
    expect(r.presentation?.references).toEqual(metaDescriptionRule.meta.references)
  })
})
