import { describe, it, expect } from 'vitest'

import { xCacheRule } from '@/rules/http/xCache'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>) => ({ html: '', url: '', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

describe('rule: x-cache', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await xCacheRule.run(P({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toContainEqual({ key: 'Header capture', value: 'Not captured', kind: 'text' })
  })

  it('reports absence as information', async () => {
    const r = await xCacheRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'X-Cache', value: 'Absent', kind: 'text' })
  })

  it('reports hit/miss', async () => {
    const r = await xCacheRule.run(P({ 'x-cache': 'HIT' }), { globals: {} })
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toEqual([{ key: 'X-Cache', value: 'HIT', kind: 'text' }])
  })

  it('preserves an unclassified header value', async () => {
    const r = await xCacheRule.run(P({ 'x-cache': 'STALE' }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'X-Cache', value: 'STALE', kind: 'text' })
    expect(r.presentation?.values.some((f) => f.key === 'Cache status')).toBe(false)
  })

  it('preserves a mixed result from multiple cache layers', async () => {
    const result = await xCacheRule.run(P({ 'X-Cache': 'MISS, HIT' }), { globals: {} })
    expect(result.presentation?.values).toContainEqual({ key: 'X-Cache', value: 'MISS, HIT', kind: 'text' })
    expect(result.presentation?.values).toContainEqual({ key: 'Cache status', value: 'Mixed HIT and MISS across reported cache layers', kind: 'text' })
    expect(result.details).toBeUndefined()
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(await xCacheRule.run(P({ 'x-cache': 'HIT' }), { globals: {} }), xCacheRule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['X-Cache: HIT', ...xCacheRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
