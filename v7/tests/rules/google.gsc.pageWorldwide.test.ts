import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn(async () => ({ property: 'https://example.com/', type: 'url-prefix' })),
}))

import { gscPageWorldwideRule } from '@/rules/google/gsc/pageWorldwideSearchAnalytics'
import { deriveGscProperty } from '@/rules/google/google-gsc-utils'

const page = { html: '', url: 'https://example.com/deep/page', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc page worldwide analytics', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports not signed in when no token is stored', async () => {
    const r = await gscPageWorldwideRule.run(page as never, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('reports an unconfirmed Search Console property as runtime_error', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValueOnce(null)
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values).toEqual([{ key: 'GSC property', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.detailValues).toEqual([{ key: 'Current page URL', value: page.url, kind: 'url' }])
  })

  it('filters the query to the exact page URL instead of scanning the top-1000 rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ rows: [{ keys: [page.url], impressions: 42, clicks: 7 }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as Record<string, unknown>
    expect(body['dimensionFilterGroups']).toEqual([
      { groupType: 'and', filters: [{ dimension: 'page', operator: 'equals', expression: page.url }] },
    ])
    expect(r.type).toBe('info')
    expect(r.priority).toBe(750)
    expect(r.presentation?.values.slice(0, 2)).toEqual([
      { key: 'Impressions', value: 42, kind: 'text' },
      { key: 'Clicks', value: 7, kind: 'text' },
    ])
    expect(r.presentation?.values[2]?.key).toBe('Period')
  })

  it('reports zero when the filtered query returns no rows', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.presentation?.values.slice(0, 2)).toEqual([
      { key: 'Impressions', value: 0, kind: 'text' },
      { key: 'Clicks', value: 0, kind: 'text' },
    ])
  })

  it('reports a runtime error naming the HTTP status on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values[0]?.value).toContain('500')
  })

  it('reports a bounded runtime error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Page URL')
  })

  it('reports an unreadable API body through the rule runtime_error branch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <') } }))
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.label).toBe('GSC')
  })

  it('never surfaces legacy details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect((r as any).details).toBeUndefined()
  })
})
