import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn().mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' }),
}))

import { deriveGscProperty } from '@/rules/google/google-gsc-utils'
import { gscIsIndexedRule } from '@/rules/google/gsc/isIndexed'

const page = { html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc is-indexed (historical impressions)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports not signed in when no token is stored', async () => {
    const r = await gscIsIndexedRule.run(page as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('reports the historical impressions figure as an observation, never a verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ rows: [{ impressions: 10664 }] }) }))
    const r = await gscIsIndexedRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toEqual([{ key: 'Historical search impressions', value: '10664 impressions', kind: 'text' }])
    expect(r.presentation?.input).toBe('Page URL + Search Console API response')
  })

  it('reports zero impressions factually, not as a failed check', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))
    const r = await gscIsIndexedRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('info')
    expect(r.presentation?.values[0]?.value).toBe('0 impressions')
  })

  it('reports a runtime error naming the HTTP status on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }))
    const r = await gscIsIndexedRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values[0]?.value).toContain('403')
  })

  it('reports a bounded runtime error message on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket hang up')))
    const r = await gscIsIndexedRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.presentation?.input).toBe('Page URL')
    expect(r.presentation?.detailValues.find((f) => f.key === 'Error')?.value).toBe('socket hang up')
  })

  it('reports a runtime error when no property can be confirmed', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValueOnce(null)
    const r = await gscIsIndexedRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(-1000)
    expect(r.presentation?.values).toEqual([{ key: 'Search Console property', value: 'Not confirmed for the signed-in account', kind: 'text' }])
  })

  it('never surfaces legacy details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ rows: [] }) }))
    const r = await gscIsIndexedRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect((r as any).details).toBeUndefined()
  })
})
