import { describe, it, expect } from 'vitest'
import { h1Rule } from '@/rules/body/h1'
const run = (html: string) => h1Rule.run({ html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
describe('H1 headings', () => {
  it('preserves nested markup, attributes, text and the actual selector', async () => {
    const html = '<h1 class="hero"><a class="link" href="/a">SEO <em>Works</em></a></h1>'
    const r = await run(html)
    expect(r.type).toBe('ok')
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.detailValues[0].value).toBe('SEO Works')
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Selector 1', value: 'html > body > h1.hero', kind: 'text' })
  })
  it('reports multiple headings as information, retaining each source', async () => {
    const r = await run('<h1 id="one">One</h1><h1 id="two">Two</h1>')
    expect(r.type).toBe('info'); expect(r.presentation?.values[0].value).toBe(2)
    expect(r.presentation?.markup).toHaveLength(2)
  })
  it('warns for missing or entirely empty headings, including multiple empty headings', async () => {
    for (const html of ['', '<h1><span> </span></h1>', '<h1> </h1><h1></h1>']) expect((await run(html)).type).toBe('warn')
  })
  it('states exact counts when only a sample of headings is retained', async () => {
    const r = await run(Array.from({ length: 12 }, (_, n) => `<h1>Heading ${n}</h1>`).join(''))
    expect(r.presentation?.values[0].value).toBe(12)
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Elements omitted', value: 2, kind: 'text' })
  })
})
