import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn().mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' }),
}))

import { gscTopQueriesOfPageRule } from '@/rules/google/gsc/topQueriesOfPage'
import { deriveGscProperty } from '@/rules/google/google-gsc-utils'

const page = { html: '', url: 'https://example.com/page', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc top queries of page', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports not signed in when no token is stored', async () => {
    const r = await gscTopQueriesOfPageRule.run(page as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('reports an unconfirmed Search Console property as runtime_error', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValueOnce(null)
    const r = await gscTopQueriesOfPageRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values).toContainEqual({ key: 'Search Console property', value: 'Not confirmed for the signed-in account', kind: 'text' })
  })

  it('lists each query as its own evidence record, bounded to 10, with retained/omitted counts', async () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({ keys: [`query ${i}`], clicks: i, impressions: i * 10 }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ rows }) }))
    const r = await gscTopQueriesOfPageRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(750)
    const queryRecords = r.presentation!.evidence.filter((e) => e.name.startsWith('Query '))
    expect(queryRecords).toHaveLength(10)
    expect(queryRecords[0]?.fields.find((f) => f.key === 'Query')?.value).toBe('query 0')
    const capture = r.presentation!.evidence.find((e) => e.name === 'Capture')
    expect(capture?.fields.find((f) => f.key === 'Retained')?.value).toBe(10)
    expect(capture?.fields.find((f) => f.key === 'Omitted')?.value).toBe(4)
    expect(r.presentation?.detailValues.find((f) => f.key === 'Returned query count')?.value).toBe(14)
  })

  it('reports no queries factually when none are returned', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))
    const r = await gscTopQueriesOfPageRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.presentation?.values[0]?.value).toBe('No queries reported')
    expect(r.presentation?.evidence).toHaveLength(0)
  })

  it('reports a runtime error naming the HTTP status on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }))
    const r = await gscTopQueriesOfPageRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values[0]?.value).toContain('429')
  })

  it('reports a bounded runtime error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS failure')))
    const r = await gscTopQueriesOfPageRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Page URL')
  })

  it('reports an unreadable API body through the rule runtime_error branch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <') } }))
    const r = await gscTopQueriesOfPageRule.run(page as never, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.label).toBe('GSC')
  })

  it('never surfaces legacy details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ rows: [] }) }))
    const r = await gscTopQueriesOfPageRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect((r as any).details).toBeUndefined()
  })
})
