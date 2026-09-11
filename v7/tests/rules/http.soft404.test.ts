import { afterEach, describe, it, expect, vi } from 'vitest'

import { soft404Rule } from '@/rules/http/soft404'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const page = (headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html: '', url: 'https://ex.com/path/page', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })

const probeOf = (fetchMock: ReturnType<typeof vi.fn>): string => String(fetchMock.mock.calls[0]?.[0])

describe('rule: soft 404 probe', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns runtime_error when headers not captured', async () => {
    const r = await soft404Rule.run(page({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
  })

  it('returns runtime_error when the page URL cannot build a probe URL', async () => {
    const r = await soft404Rule.run({ html: '', url: 'not a url', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: { a: '1' } }, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(10)
    expect(r.presentation?.values).toContainEqual({ key: 'Probe URL', value: 'Could not be built', kind: 'text' })
  })

  it('returns ok when non-existing URL returns 404 directly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'Final status', value: 'HTTP 404 Not Found', kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Redirect count', value: 0, kind: 'text' })
  })

  it('returns ok when non-existing URL returns 410 directly (equally valid not-found signal)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 410, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toContainEqual({ key: 'Classification', value: 'Direct HTTP 410 (expected)', kind: 'text' })
  })

  it('flags soft 404 when 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.values).toContainEqual({ key: 'Classification', value: 'Soft 404 - HTTP 200 instead of 404', kind: 'text' })
  })

  it('reports redirected 404 as info and shows the full hop chain', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('fake-url-for-soft-404')) {
        return { status: 301, type: 'basic', url, headers: new Headers({ location: 'https://mirror.ex.com/step' }) }
      }
      if (url === 'https://mirror.ex.com/step') {
        return { status: 302, type: 'basic', url, headers: new Headers({ location: 'https://mirror.ex.com/gone' }) }
      }
      return { status: 404, type: 'basic', url, headers: new Headers() }
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Redirect count', value: 2, kind: 'text' })
    expect(r.presentation?.evidence.map((e) => e.name)).toEqual(['Hop 1', 'Hop 2', 'Hop 3'])
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'URL', value: probeOf(fetchMock), kind: 'url' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Redirect target', value: 'https://mirror.ex.com/step', kind: 'url' })
    expect(r.presentation?.evidence[2]?.fields).toContainEqual({ key: 'Status', value: 'HTTP 404 Not Found', kind: 'text' })
    expect(r.details).toBeUndefined()
  })

  it('flags a redirect loop on the probe as an error', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const target = url.endsWith('/loop-b') ? url.replace('/loop-b', '/loop-a') : `${new URL(url).origin}/loop-b`
      return { status: 302, type: 'basic', url, headers: new Headers({ location: target }) }
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('error')
    expect(r.priority).toBe(40)
    expect(r.presentation?.values).toContainEqual({ key: 'Classification', value: 'Redirect loop', kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Loop detected', value: 'Yes', kind: 'text' })
  })

  it('reports a rate-limited probe as inconclusive, never a passing verdict', async () => {
    // Uses its own origin: a 429 response marks that origin's shared probe queue
    // on cooldown for 60s, which would otherwise leak into later tests reusing
    // the same origin as `page()`.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429, type: 'basic', redirected: false, url: 'https://ratelimited.ex.test/fake', headers: new Headers() }))
    const r = await soft404Rule.run({ ...page(), url: 'https://ratelimited.ex.test/path/page' }, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(600)
    expect(r.presentation?.values).toContainEqual({ key: 'Classification', value: 'Inconclusive - rate limited (429)', kind: 'text' })
  })

  it('passes another 4xx as a not-found signal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 403, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Page URL + Soft 404 probe HTTP response')
    expect(r.presentation?.values).toContainEqual({ key: 'Final status', value: 'HTTP 403 Forbidden', kind: 'text' })
  })

  it('reports a server error on the probe as inconclusive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 500, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(600)
    expect(r.presentation?.values).toContainEqual({ key: 'Classification', value: 'Inconclusive - server error', kind: 'text' })
  })

  it('reports a failed probe loudly, never a passing verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const r = await soft404Rule.run(page(), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(5)
    expect(r.presentation?.values.find((f) => f.key === 'Probe failure')?.value).toContain('network down')
  })

  it('copies references and labelled facts without legacy details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const result = enrichResult(await soft404Rule.run(page(), { globals: {} }), soft404Rule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['HTTP 404 Not Found', ...soft404Rule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
