import { describe, it, expect } from 'vitest'
import { h1Rule } from '@/rules/body/h1'
const run = (html: string) => h1Rule.run({ html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((field) => field.key === key)?.value
describe('H1 headings', () => {
  it('preserves nested markup, attributes, text and the actual selector', async () => {
    const html = '<h1 class="hero"><a class="link" href="/a">SEO <em>Works</em></a></h1>'
    const r = await run(html)
    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toEqual([{ key: '<h1>', value: html, kind: 'original', fidelity: 'complete-original' }])
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.evidence[0]).toEqual({ name: '<h1>', fields: [{ key: 'Text', value: 'SEO Works', kind: 'text' }, { key: 'DOM path', value: 'html > body > h1.hero', kind: 'path' }] })
  })
  it('reports multiple headings as information, retaining each source in the overview', async () => {
    const r = await run('<h1 id="one">One</h1><h1 id="two">Two</h1>')
    expect(r.type).toBe('info'); expect(value(r, 'H1 headings')).toBe(2)
    expect(r.presentation?.values.filter((field) => field.kind === 'original').map((field) => field.key)).toEqual(['<h1> 1', '<h1> 2'])
    expect(r.presentation?.markup).toHaveLength(2)
  })
  it('warns for missing or entirely empty headings, including multiple empty headings', async () => {
    for (const html of ['', '<h1><span> </span></h1>', '<h1> </h1><h1></h1>']) expect((await run(html)).type).toBe('warn')
    expect(value(await run(''), 'H1')).toBe('Not found')
    expect(value(await run('<h1><span> </span></h1>'), 'Text')).toBe('Empty')
    expect(value(await run('<h1> </h1><h1></h1>'), 'Empty headings')).toBe(2)
  })
  it('states exact counts and summarizes the texts when only a sample of headings is retained', async () => {
    const r = await run(Array.from({ length: 12 }, (_, n) => `<h1>Heading ${n}</h1>`).join(''))
    expect(value(r, 'H1 headings')).toBe(12)
    expect(value(r, 'Headings')).toBe('Heading 0, Heading 1, Heading 2, Heading 3 … 6 more')
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence omitted', value: 2, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup retained', value: 10, kind: 'text' })
  })
})
