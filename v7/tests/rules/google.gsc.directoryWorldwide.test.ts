import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn().mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' }),
  createGscPropertyDerivationFailedResult: vi.fn((url: string) => ({ label: 'GSC', message: `no property for ${url}`, type: 'runtime_error', name: 'mock' })),
}))

import { gscDirectoryWorldwideRule } from '@/rules/google/gsc/pageDirectoryWorldwideSearchAnalytics'

const page = { html: '', url: 'https://example.com/blog/post-1', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc directory worldwide analytics', () => {
  afterEach(() => vi.restoreAllMocks())

  it('requests the aggregate (no page dimension, no rowLimit) so totals are not capped at 10 rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ rows: [{ impressions: 12345, clicks: 678 }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as Record<string, unknown>
    expect(body['dimensions']).toBeUndefined()
    expect(body['rowLimit']).toBeUndefined()
    expect(body['dimensionFilterGroups']).toEqual([
      { groupType: 'and', filters: [{ dimension: 'page', operator: 'contains', expression: 'https://example.com/blog/' }] },
    ])
    expect(r.type).toBe('info')
    expect(r.message).toBe('Directory impressions 12345.')
    expect(r.details?.['directory']).toBe('https://example.com/blog/')
  })
})
