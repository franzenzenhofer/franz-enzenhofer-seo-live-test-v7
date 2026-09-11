import { describe, expect, it } from 'vitest'
import { pageSummaryRule } from '@/rules/debug/pageSummary'

const page = (html: string, extra: Record<string, unknown> = {}) =>
  ({ html, url: 'https://ex.com', doc: new DOMParser().parseFromString(html, 'text/html'), ...extra }) as any

describe('rule: debug page summary', () => {
  it('reports title text, header count and resource count as labelled scalars', async () => {
    const r = await pageSummaryRule.run(page('<title>Hello</title>', { headers: { a: '1', b: '2' }, resources: ['x', 'y', 'z'] }), { globals: {} } as any)
    expect(r.type).toBe('info')
    expect(r.priority).toBe(950)
    const values = Object.fromEntries(r.presentation!.values.map((f) => [f.key, f.value]))
    expect(values['Title text']).toBe('Hello')
    expect(values['Header count']).toBe(2)
    expect(values['Resource count']).toBe(3)
    expect(r.presentation?.markup).toHaveLength(1)
  })

  it('reports missing title factually', async () => {
    const r = await pageSummaryRule.run(page('<p></p>'), { globals: {} } as any)
    const values = Object.fromEntries(r.presentation!.values.map((f) => [f.key, f.value]))
    expect(values['Title text']).toBe('Not found')
    expect(r.presentation?.markup).toHaveLength(0)
    expect(r.presentation?.noMarkup).toBe('No matching <title> element found')
  })

  it('never surfaces legacy details or a generic dump', async () => {
    const r = await pageSummaryRule.run(page('<title>X</title>'), { globals: {} } as any)
    expect((r as any).details).toBeUndefined()
    const allValues = [...r.presentation!.values, ...r.presentation!.detailValues]
    expect(allValues.every((f) => typeof f.value === 'string' || typeof f.value === 'number')).toBe(true)
  })
})
