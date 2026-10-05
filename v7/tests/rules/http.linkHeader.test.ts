import { describe, it, expect } from 'vitest'

import { linkHeaderRule } from '@/rules/http/linkHeader'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>, url = 'https://ex.com/') => ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

describe('rule: http link header', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await linkHeaderRule.run(P({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toEqual([{ key: 'Response headers', value: 'Not captured', kind: 'text' }])
  })

  it('reports absence as info', async () => {
    const r = await linkHeaderRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toEqual([{ key: 'Link', value: 'Absent', kind: 'text' }])
    expect(r.presentation?.evidence).toEqual([])
  })

  it('reports presence as the target URL keyed by its rel, never a URL inside text', async () => {
    const r = await linkHeaderRule.run(P({ link: '<https://ex.com>; rel=preload' }), { globals: {} })
    expect(r.presentation?.values).toEqual([{ key: 'rel=preload', value: 'https://ex.com', kind: 'url' }])
    expect(r.presentation?.evidence).toEqual([{ name: 'Link entry 1', fields: [{ key: 'URL', value: 'https://ex.com', kind: 'url' }, { key: 'rel', value: 'preload', kind: 'text' }] }])
    expect(r.priority).toBe(750)
  })

  it('splits link-values only on top-level commas per RFC 8288', async () => {
    const header = '<https://ex.com/x>; rel="canonical"; title="Products, Sale", <https://ex.com/a,b>; rel="alternate"'
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect(r.presentation?.values.map((field) => field.key)).toEqual(['rel=canonical', 'rel=alternate'])
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'title', value: 'Products, Sale', kind: 'text' })
    expect(r.presentation?.evidence[1]?.fields).toContainEqual({ key: 'URL', value: 'https://ex.com/a,b', kind: 'url' })
  })

  it('numbers repeated rel keys and resolves relative targets against the page', async () => {
    const header = '</a.css>; rel=preload; as=style, </b.js>; rel=preload; as=script'
    const r = await linkHeaderRule.run(P({ link: header }, 'https://ex.com/page'), { globals: {} })
    expect(r.presentation?.values).toEqual([{ key: 'rel=preload 1', value: '/a.css', kind: 'url' }, { key: 'rel=preload 2', value: '/b.js', kind: 'url' }])
    expect(r.presentation?.evidence[1]?.fields).toContainEqual({ key: 'as', value: 'script', kind: 'text' })
  })

  it('summarises more than three entries by count and relations and ships one record per entry', async () => {
    const header = Array.from({ length: 12 }, (_, i) => `<https://ex.com/${i}>; rel=${i % 2 ? 'prefetch' : 'preload'}`).join(', ')
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect(r.presentation?.values).toEqual([{ key: 'Link entries', value: 12, kind: 'text' }, { key: 'Relations', value: 'preload, prefetch', kind: 'text' }])
    expect(r.presentation?.evidence).toHaveLength(12)
    expect(r.presentation?.evidence[11]?.name).toBe('Link entry 12')
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(await linkHeaderRule.run(P({ link: '<https://ex.com>; rel=preload' }), { globals: {} }), linkHeaderRule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['https://ex.com', 'rel: preload', ...linkHeaderRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
