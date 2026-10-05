import { describe, it, expect } from 'vitest'
import { titleRule } from '@/rules/head/title'
import { presentationSchema } from '@/shared/presentation/schema'

const run = (html: string) => titleRule.run({ html, url: 'https://example.com', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value

describe('title rule', () => {
  it('reports absence as Not found with no invented markup or evidence', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('error'); expect(value(r, 'Title')).toBe('Not found')
    expect(r.presentation?.markup).toEqual([]); expect(r.presentation?.evidence).toEqual([])
    expect(presentationSchema.safeParse(r.presentation).success).toBe(true)
  })
  it('reports empty and whitespace-only titles', async () => {
    for (const text of ['', '   ']) {
      const r = await run(`<title>${text}</title>`)
      expect(r.type).toBe('error'); expect(value(r, 'Characters')).toBe(0)
      expect(r.presentation?.detailValues[0]).toEqual({ key: 'Title', value: text, kind: 'text' })
    }
  })
  it('retains all sampled duplicate titles as numbered tag-labelled markup, evidence and text', async () => {
    const r = await run('<title id="a">First</title><title lang="de">Second</title>')
    expect(r.type).toBe('error'); expect(value(r, 'Title elements')).toBe(2)
    expect(r.presentation?.values.map((f) => f.key)).toEqual(['Title elements', '<title> 1', '<title> 2'])
    expect(r.presentation?.markup.map((f) => f.value)).toEqual(['<title id="a">First</title>', '<title lang="de">Second</title>'])
    expect(r.presentation?.evidence.map((record) => record.name)).toEqual(['<title> 1', '<title> 2'])
    expect(r.presentation?.evidence[1].fields).toEqual([{ key: 'DOM path', value: 'html > head > title:nth-of-type(2)', kind: 'path' }])
    expect(r.presentation?.detailValues.slice(0, 2).map((f) => f.value)).toEqual(['First', 'Second'])
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup retained', value: 2, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence omitted', value: 0, kind: 'text' })
  })
  it('passes one non-empty title, preserving all attributes and decoded text separately', async () => {
    const markup = '<title lang="de" data-template="trip"> A &amp; B </title>'
    const r = await run(markup)
    expect(r.type).toBe('ok'); expect(value(r, '<title>')).toBe(markup)
    expect(r.presentation?.values.map((f) => f.key)).toEqual(['Characters', '<title>']); expect(value(r, 'Characters')).toBe(5)
    expect(r.presentation?.detailValues[0]).toMatchObject({ key: 'Title', value: ' A & B ', kind: 'text' })
    expect(r.presentation?.evidence).toEqual([{ name: '<title>', fields: [{ key: 'DOM path', value: 'html > head > title', kind: 'path' }] }])
    expect(r.presentation?.references).toEqual(titleRule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
