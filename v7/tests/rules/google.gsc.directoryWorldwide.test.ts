import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn().mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' }),
}))

import { gscDirectoryWorldwideRule } from '@/rules/google/gsc/pageDirectoryWorldwideSearchAnalytics'
import { deriveGscProperty } from '@/rules/google/google-gsc-utils'

const page = { html: '', url: 'https://example.com/blog/post-1', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc directory worldwide analytics', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports not signed in when no token is stored', async () => {
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('reports an unconfirmed Search Console property as runtime_error', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValueOnce(null)
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values).toContainEqual({ key: 'Search Console property', value: 'Not confirmed for the signed-in account', kind: 'text' })
  })

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
      { groupType: 'and', filters: [{ dimension: 'page', operator: 'includingRegex', expression: '^https://example\\.com/blog/' }] },
    ])
    expect(r.type).toBe('info')
    expect(r.priority).toBe(750)
    expect(r.presentation?.values).toEqual([
      { key: 'Directory impressions', value: 12345, kind: 'text' },
      { key: 'Directory clicks', value: 678, kind: 'text' },
    ])
    expect(r.presentation?.detailValues.find((f) => f.key === 'Directory')?.value).toBe('https://example.com/blog/')
  })

  it('reports a runtime error naming the HTTP status on API failure, including the directory', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }))
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values[0]?.value).toContain('403')
    expect(r.presentation?.detailValues.find((f) => f.key === 'Directory')?.value).toBe('https://example.com/blog/')
  })

  it('reports a bounded runtime error on a network failure, including the directory', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection reset')))
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Page URL')
    expect(r.presentation?.detailValues.find((f) => f.key === 'Directory')?.value).toBe('https://example.com/blog/')
  })

  it('reports an unreadable API body through the rule runtime_error branch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <') } }))
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.label).toBe('GSC')
  })

  it('never surfaces legacy details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ rows: [] }) }))
    const r = await gscDirectoryWorldwideRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect((r as any).details).toBeUndefined()
  })
})
