import { describe, it, expect } from 'vitest'
import { parameterizedLinksRule } from '@/rules/body/parameterizedLinks'
const run = (html: string) => parameterizedLinksRule.run({ html, url: 'https://example.test/page', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((field) => field.key === key)?.value
describe('links with URL parameters', () => {
  it('excludes fragment question marks, empty queries and non-HTTP schemes', async () => {
    const r = await run('<a href="/a?x=1">A</a><a href="/b#part?x=1">B</a><a href="/c?">C</a><a href="mailto:a@example.test?subject=x">Mail</a>')
    expect(value(r, 'Links checked')).toBe(4)
    expect(value(r, 'Parameter links')).toBeUndefined()
    expect(r.presentation?.values[1]).toMatchObject({ key: '<a>', kind: 'original', value: '<a href="/a?x=1">A</a>' })
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'href', value: 'https://example.test/a?x=1', kind: 'url' })
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Query', value: '?x=1', kind: 'text' })
  })
  it('honors the document base and preserves complete link markup', async () => {
    const link = '<a class="trip" href="tour?x=1&amp;y=2"><strong>Trip</strong></a>'
    const r = await run('<base href="https://other.test/trips/">' + link)
    expect(r.presentation?.markup[0].value).toBe(link)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'href', value: 'https://other.test/trips/tour?x=1&y=2', kind: 'url' })
    expect(r.presentation?.checked).toContainEqual({ key: 'Document base', value: 'https://other.test/trips/', kind: 'text' })
    expect(r.presentation?.references).toEqual(parameterizedLinksRule.meta.references)
  })
  it('ships every matching link with truthful counts and summarizes the queries above three', async () => {
    const r = await run(Array.from({ length: 12 }, (_, i) => `<a href="/?n=${i}">Link ${i}</a>`).join(''))
    expect(value(r, 'Parameter links')).toBe(12)
    expect(value(r, 'Queries')).toBe('?n=0, ?n=1, ?n=2, ?n=3, ?n=4, ?n=5, ?n=6, ?n=7 … 4 more')
    expect(r.presentation?.evidence).toHaveLength(12)
    expect(r.presentation?.markup).toHaveLength(12)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 0, kind: 'text' })
  })
  it('shows the inspected anchors when none carries parameters', async () => {
    const r = await run('<a href="/plain">Plain</a>')
    expect(value(r, 'Parameter links')).toBe(0)
    expect(r.presentation?.values.find((field) => field.kind === 'original')?.value).toBe('<a href="/plain">Plain</a>')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence retained', value: 1, kind: 'text' })
  })
})
