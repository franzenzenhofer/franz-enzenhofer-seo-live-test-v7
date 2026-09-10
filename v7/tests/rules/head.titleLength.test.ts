import { describe, it, expect } from 'vitest'
import { titleLengthRule } from '@/rules/head/titleLength'
const run = (html: string) => titleLengthRule.run({ html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
describe('page title length', () => {
  it('measures short, long, blank and non-BMP text without an invented threshold', async () => {
    for (const title of ['x', 'word '.repeat(60), '   ', '😀']) {
      const r = await run(`<title data-template="seo">${title}</title>`)
      expect(r.type).toBe('info')
      expect(r.presentation?.values[0].value).toBe(title.trim().length)
      expect(r.presentation?.detailValues).toContainEqual({ key: 'Title', value: title, kind: 'text' })
      expect(r.presentation?.markup[0].value).toContain('data-template="seo"')
      expect(r.presentation?.checked).toContainEqual({ key: 'Length threshold', value: 'None', kind: 'text' })
    }
  })
  it('reports missing input without inventing a zero-length title', async () => {
    const r = await run('<p>No title</p>')
    expect(r.type).toBe('info'); expect(r.presentation?.values[0].value).toBe('Not measurable')
    expect(r.presentation?.markup).toEqual([])
  })
  it('identifies first-match measurement when there are duplicate titles', async () => {
    const r = await run('<title>First</title><title>Second longer</title>')
    expect(r.presentation?.values[0].value).toBe(5)
    expect(r.presentation?.detailValues[0].value).toBe(2)
  })
})
