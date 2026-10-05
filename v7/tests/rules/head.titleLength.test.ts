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
    expect(r.type).toBe('info'); expect(r.presentation?.values).toEqual([{ key: 'Title', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.markup).toEqual([]); expect(r.presentation?.evidence).toEqual([])
  })
  it('keeps the overview as count plus <title> markup, with one tag-named evidence record and the four count rows', async () => {
    const r = await run('<title data-template="seo">Alex - Chef</title>')
    expect(r.presentation?.values).toEqual([{ key: 'Characters', value: 11, kind: 'text' },
      { key: '<title>', value: '<title data-template="seo">Alex - Chef</title>', kind: 'original', fidelity: 'complete-original' }])
    expect(r.presentation?.evidence).toEqual([{ name: '<title>', fields: [{ key: 'DOM path', value: 'html > head > title', kind: 'path' }] }])
    expect(r.presentation?.detailValues).toEqual([{ key: 'Title', value: 'Alex - Chef', kind: 'text' },
      { key: 'Markup retained', value: 1, kind: 'text' }, { key: 'Markup omitted', value: 0, kind: 'text' },
      { key: 'Evidence retained', value: 1, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' }])
  })
  it('identifies first-match measurement when there are duplicate titles', async () => {
    const r = await run('<title>First</title><title>Second longer</title>')
    expect(r.presentation?.values[0].value).toBe(5)
    expect(r.presentation?.detailValues[0]).toEqual({ key: 'Title elements', value: 2, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 1, kind: 'text' })
  })
})
