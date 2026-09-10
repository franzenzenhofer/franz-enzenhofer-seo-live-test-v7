import { describe, it, expect } from 'vitest'
import { parameterizedLinksRule } from '@/rules/body/parameterizedLinks'
const run = (html: string) => parameterizedLinksRule.run({ html, url: 'https://example.test/page', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
describe('links with URL parameters', () => {
  it('excludes fragment question marks, empty queries and non-HTTP schemes', async () => {
    const r = await run('<a href="/a?x=1">A</a><a href="/b#part?x=1">B</a><a href="/c?">C</a><a href="mailto:a@example.test?subject=x">Mail</a>')
    expect(r.presentation?.values[0].value).toBe(1)
    expect(r.presentation?.values[1].value).toBe(4)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Resolved URL', value: 'https://example.test/a?x=1', kind: 'url' })
  })
  it('honors the document base and preserves complete link markup', async () => {
    const link = '<a class="trip" href="tour?x=1&amp;y=2"><strong>Trip</strong></a>'
    const r = await run('<base href="https://other.test/trips/">' + link)
    expect(r.presentation?.markup[0].value).toBe(link)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Resolved URL', value: 'https://other.test/trips/tour?x=1&y=2', kind: 'url' })
    expect(r.presentation?.references).toEqual(parameterizedLinksRule.meta.references)
  })
  it('states omissions instead of silently losing the rest of a large set', async () => {
    const r = await run(Array.from({ length: 12 }, (_, i) => `<a href="/?n=${i}">Link ${i}</a>`).join(''))
    expect(r.presentation?.values[0].value).toBe(12)
    expect(r.presentation?.evidence).toHaveLength(12)
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup records omitted', value: 2, kind: 'text' })
  })
})
