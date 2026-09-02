import { afterEach, describe, it, expect, vi } from 'vitest'

import { soft404Rule } from '@/rules/http/soft404'

const page = (headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html: '', url: 'https://ex.com/path/page', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })

const probeOf = (fetchMock: ReturnType<typeof vi.fn>): string => String(fetchMock.mock.calls[0]?.[0])

describe('rule: soft 404 probe', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns runtime_error when headers not captured', async () => {
    const r = await soft404Rule.run(page({}) as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('Hard Reload')
  })

  it('returns ok when non-existing URL returns 404 directly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.details?.['status']).toBe(404)
    expect(r.details?.['redirectCount']).toBe(0)
    expect(r.details?.['redirectChainText']).toContain('FINAL STATUS HTTP 404')
  })

  it('returns ok when non-existing URL returns 410 directly (equally valid not-found signal)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 410, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.message).toBe('Non-existing URL returned HTTP 410 (expected).')
    expect(r.details?.['status']).toBe(410)
  })

  it('flags soft 404 when 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('error')
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
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('info')
    // Short verdict with the measured hop count - the chain wall stays out of the message.
    expect(r.message).toBe('Non-existing URL returned HTTP 404 after 2 redirects (should be a direct 404).')
    // The full chain - every hop, every status - renders once, in details.
    const chainText = r.details?.['redirectChainText'] as string
    expect(chainText).toContain(probeOf(fetchMock))
    expect(chainText).toContain('HTTP 301 -> Location: https://mirror.ex.com/step')
    expect(chainText).toContain('HTTP 302 -> Location: https://mirror.ex.com/gone')
    expect(chainText).toContain('FINAL STATUS HTTP 404')
    expect(r.details?.['redirectChain']).toBeUndefined()
    expect(r.details?.['redirectCount']).toBe(2)
  })

  it('flags a redirect loop on the probe as an error', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const target = url.endsWith('/loop-b') ? url.replace('/loop-b', '/loop-a') : `${new URL(url).origin}/loop-b`
      if (url.endsWith('/loop-a') || url.includes('fake-url-for-soft-404')) {
        return { status: 302, type: 'basic', url, headers: new Headers({ location: target }) }
      }
      return { status: 302, type: 'basic', url, headers: new Headers({ location: target }) }
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('error')
    expect(r.message).toContain('the redirect chain loops')
    expect(r.details?.['redirectChainText']).toContain('REDIRECT LOOP')
  })

  it('reports a failed probe loudly, never a passing verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('network down')
  })
})
