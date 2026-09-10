import { describe, it, expect } from 'vitest'
import { titleRule } from '@/rules/head/title'
import { presentationSchema } from '@/shared/presentation/schema'

const run = (html: string) => titleRule.run({ html, url: 'https://example.com', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value

describe('title rule', () => {
  it('reports absence with a zero count and no invented markup', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('error'); expect(value(r, 'Title elements')).toBe(0)
    expect(r.presentation?.markup).toEqual([])
    expect(presentationSchema.safeParse(r.presentation).success).toBe(true)
  })
  it('reports empty and whitespace-only titles', async () => {
    for (const text of ['', '   ']) {
      const r = await run(`<title>${text}</title>`)
      expect(r.type).toBe('error'); expect(value(r, 'Title text')).toBe('Empty')
      expect(r.presentation?.detailValues[0].value).toBe(text)
    }
  })
  it('retains all sampled duplicate titles and their text', async () => {
    const r = await run('<title id="a">First</title><title lang="de">Second</title>')
    expect(r.type).toBe('error'); expect(value(r, 'Title elements')).toBe(2)
    expect(r.presentation?.markup.map((f) => f.value)).toEqual(['<title id="a">First</title>', '<title lang="de">Second</title>'])
    expect(r.presentation?.detailValues.map((f) => f.value)).toEqual(['First', 'Second'])
  })
  it('passes one non-empty title, preserving all attributes and decoded text separately', async () => {
    const markup = '<title lang="de" data-template="trip"> A &amp; B </title>'
    const r = await run(markup)
    expect(r.type).toBe('ok'); expect(value(r, '<title>')).toBe(markup)
    expect(r.presentation?.detailValues[0]).toMatchObject({ key: 'Title', value: ' A & B ', kind: 'text' })
    expect(r.presentation?.references).toEqual(titleRule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
