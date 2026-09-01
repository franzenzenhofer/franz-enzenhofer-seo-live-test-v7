import { afterEach, describe, it, expect, vi } from 'vitest'

import { soft404Rule } from '@/rules/http/soft404'

import type { RedirectChain } from '@/shared/redirectChainTypes'

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
    const chain = r.details?.['redirectChain'] as RedirectChain
    expect(chain.finalStatus).toBe(404)
    expect(chain.redirectCount).toBe(0)
  })

  it('flags soft 404 when 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, type: 'basic', redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('error')
  })

  it('flags redirected 404 and shows the full hop chain', async () => {
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
    expect(r.type).toBe('warn')
    expect(r.message).toContain('after redirect(s)')
    // The full chain is visible in the message and in details - every hop, every status.
    expect(r.message).toContain(probeOf(fetchMock))
    expect(r.message).toContain('HTTP 301 -> Location: https://mirror.ex.com/step')
    expect(r.message).toContain('HTTP 302 -> Location: https://mirror.ex.com/gone')
    expect(r.message).toContain('FINAL STATUS HTTP 404')
    const chain = r.details?.['redirectChain'] as RedirectChain
    expect(chain.hops.map((h) => h.status)).toEqual([301, 302, 404])
    expect(r.details?.['redirectChainText']).toContain('https://mirror.ex.com/gone')
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
    expect(r.message).toContain('REDIRECT LOOP')
    expect((r.details?.['redirectChain'] as RedirectChain).loop).toBe(true)
  })

  it('reports a failed probe loudly, never a passing verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const r = await soft404Rule.run(page() as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('network down')
  })
})
