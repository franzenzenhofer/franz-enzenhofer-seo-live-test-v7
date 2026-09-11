import { describe, it, expect } from 'vitest'

import { linkHeaderRule } from '@/rules/http/linkHeader'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>) => ({ html: '', url: '', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

describe('rule: http link header', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await linkHeaderRule.run(P({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toContainEqual({ key: 'Header capture', value: 'Not captured', kind: 'text' })
  })

  it('reports absence as info', async () => {
    const r = await linkHeaderRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'Link header', value: 'Not present', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Link entries', value: 0, kind: 'text' })
  })

  it('reports presence', async () => {
    const r = await linkHeaderRule.run(P({ link: '<https://ex.com>; rel=preload' }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Link header', value: '<https://ex.com>; rel=preload', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Link entries', value: 1, kind: 'text' })
    expect(r.priority).toBe(750)
  })

  it('splits link-values only on top-level commas per RFC 8288', async () => {
    const header = '<https://ex.com/x>; rel="canonical"; title="Products, Sale", <https://ex.com/a,b>; rel="alternate"'
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Link entries', value: 2, kind: 'text' })
    const entries = r.presentation?.evidence.find((e) => e.name === 'Parsed Link entries')
    expect(entries?.fields[0]?.value).toContain('title="Products, Sale"')
    expect(entries?.fields[1]?.value).toContain('<https://ex.com/a,b>')
  })

  it('counts plain multi-value headers', async () => {
    const header = '<https://ex.com/a>; rel=preload, <https://ex.com/b>; rel=prefetch'
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Link entries', value: 2, kind: 'text' })
  })

  it('reports retained/omitted counts once when entries exceed the display limit', async () => {
    const header = Array.from({ length: 12 }, (_, i) => `<https://ex.com/${i}>; rel=preload`).join(', ')
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Link entries', value: 12, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Entries retained', value: 10, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Entries omitted', value: 2, kind: 'text' })
    const entries = r.presentation?.evidence.find((e) => e.name === 'Parsed Link entries')
    expect(entries?.fields).toHaveLength(10)
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(await linkHeaderRule.run(P({ link: '<https://ex.com>; rel=preload' }), { globals: {} }), linkHeaderRule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['<https://ex.com>; rel=preload', ...linkHeaderRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
