import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: async () => ({ property: 'https://example.com/', type: 'url-prefix' }),
  createGscPropertyDerivationFailedResult: (url: string) => ({ label: 'GSC', message: `no property for ${url}`, type: 'runtime_error', name: 'mock' }),
}))

import { gscPageWorldwideRule } from '@/rules/google/gsc/pageWorldwideSearchAnalytics'

const page = { html: '', url: 'https://example.com/deep/page', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc page worldwide analytics', () => {
  afterEach(() => vi.unstubAllGlobals())

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
    expect(r.message).toBe('Impressions 42, Clicks 7')
    expect(r.details?.['impressions']).toBe(42)
    expect(r.details?.['clicks']).toBe(7)
  })

  it('reports zero when the filtered query returns no rows', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))
    const r = await gscPageWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.message).toBe('Impressions 0, Clicks 0')
  })
})
