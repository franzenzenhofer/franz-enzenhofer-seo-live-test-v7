import { describe, expect, it } from 'vitest'

import { chainResponse, scriptFetch } from '../helpers/redirectFetch'

import { followRedirectChain } from '@/shared/redirectChain'
import { formatRedirectChain } from '@/shared/redirectChainFormat'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'
import { RedirectChainError } from '@/shared/redirectChainTypes'

describe('followRedirectChain', () => {
  it('captures a single 301 then 200', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/old': { status: 301, location: 'https://a.test/new' },
      'https://a.test/new': { status: 200 },
    })
    const { chain } = await followRedirectChain('https://a.test/old', { fetchFn })
    expect(chain.hops).toEqual([
      { url: 'https://a.test/old', status: 301, location: 'https://a.test/new' },
      { url: 'https://a.test/new', status: 200 },
    ])
    expect(chain.finalUrl).toBe('https://a.test/new')
    expect(chain.finalStatus).toBe(200)
    expect(chain.redirectCount).toBe(1)
    expect(chain.redirected).toBe(true)
    expect(chain.loop).toBe(false)
  })

  it('captures a 4-hop chain with every status and Location', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/1': { status: 301, location: 'https://a.test/2' },
      'https://a.test/2': { status: 302, location: 'https://b.test/3' },
      'https://b.test/3': { status: 307, location: 'https://b.test/4' },
      'https://b.test/4': { status: 308, location: 'https://c.test/end' },
      'https://c.test/end': { status: 404 },
    })
    const { chain } = await followRedirectChain('https://a.test/1', { fetchFn })
    expect(chain.hops.map((h) => h.status)).toEqual([301, 302, 307, 308, 404])
    expect(chain.hops.map((h) => h.location)).toEqual([
      'https://a.test/2', 'https://b.test/3', 'https://b.test/4', 'https://c.test/end', undefined,
    ])
    expect(chain.redirectCount).toBe(4)
    expect(chain.finalStatus).toBe(404)
    expect(chain.finalUrl).toBe('https://c.test/end')
  })

  it('detects a redirect loop and reports the looping URL', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/x': { status: 301, location: 'https://a.test/y' },
      'https://a.test/y': { status: 302, location: 'https://a.test/x' },
    })
    const { chain } = await followRedirectChain('https://a.test/x', { fetchFn })
    expect(chain.loop).toBe(true)
    expect(chain.loopUrl).toBe('https://a.test/x')
    expect(chain.hops).toHaveLength(2)
    expect(formatRedirectChain(chain)).toContain('REDIRECT LOOP')
  })

  it('stops at the hop cap and says so', async () => {
    const script: Record<string, { status: number; location?: string }> = {}
    for (let i = 0; i < 20; i += 1) script[`https://a.test/${i}`] = { status: 301, location: `https://a.test/${i + 1}` }
    const fetchFn = scriptFetch(script)
    const { chain } = await followRedirectChain('https://a.test/0', { fetchFn, maxHops: 10 })
    expect(chain.capped).toBe(true)
    expect(chain.redirectCount).toBe(10)
    expect(chain.hops).toHaveLength(10)
    expect(formatRedirectChain(chain)).toContain('HOP CAP HIT')
  })

  it('resolves relative Location headers against the current hop URL', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/dir/page': { status: 301, location: '../other' },
      'https://a.test/other': { status: 200 },
    })
    const { chain } = await followRedirectChain('https://a.test/dir/page', { fetchFn })
    expect(chain.hops[0]?.location).toBe('https://a.test/other')
    expect(chain.finalUrl).toBe('https://a.test/other')
    expect(chain.finalStatus).toBe(200)
  })

  it('flags an https to http downgrade', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/secure': { status: 301, location: 'http://a.test/insecure' },
      'http://a.test/insecure': { status: 200 },
    })
    const { chain } = await followRedirectChain('https://a.test/secure', { fetchFn })
    expect(chain.httpDowngrade).toBe(true)
    expect(formatRedirectChain(chain)).toContain('DOWNGRADE')
  })

  it('times out with a RedirectChainError carrying captured hops', async () => {
    const hanging = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })) as unknown as typeof fetch
    await expect(followRedirectChain('https://slow.test/', { fetchFn: hanging, timeoutMs: 30 }))
      .rejects.toThrow(RedirectChainError)
    await expect(followRedirectChain('https://slow.test/', { fetchFn: hanging, timeoutMs: 30 }))
      .rejects.toThrow(/timed out after 0.03s at https:\/\/slow.test\//)
  })

  it('stops loudly on a redirect without a Location header', async () => {
    const fetchFn = scriptFetch({ 'https://a.test/broken': { status: 302 } })
    const { chain } = await followRedirectChain('https://a.test/broken', { fetchFn })
    expect(chain.finalStatus).toBe(302)
    expect(chain.note).toContain('without a Location header')
    expect(chain.hops).toEqual([{ url: 'https://a.test/broken', status: 302 }])
  })

  it('reports hidden hops when the runtime returns opaqueredirect', async () => {
    let call = 0
    const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
      call += 1
      if (call === 1 && init?.redirect === 'manual') return chainResponse(String(input), { status: 0, type: 'opaqueredirect' })
      return chainResponse(String(input), { status: 200, url: 'https://a.test/final' })
    }) as unknown as typeof fetch
    const { chain } = await followRedirectChain('https://a.test/start', { fetchFn })
    expect(chain.hopsHidden).toBe(true)
    expect(chain.redirected).toBe(true)
    expect(chain.finalUrl).toBe('https://a.test/final')
    expect(chain.finalStatus).toBe(200)
    expect(chain.note).toContain('opaqueredirect')
  })

  it('returns the final body only when wantBody is set', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/r': { status: 301, location: 'https://a.test/final' },
      'https://a.test/final': { status: 200, body: '<html>x</html>' },
    })
    const withBody = await followRedirectChain('https://a.test/r', { fetchFn, wantBody: true })
    expect(await withBody.response?.text()).toBe('<html>x</html>')
    const withoutBody = await followRedirectChain('https://a.test/r', { fetchFn })
    expect(withoutBody.response).toBeUndefined()
  })
})

describe('formatRedirectChain', () => {
  it('renders every hop with URL, status and Location, never truncated', async () => {
    const fetchFn = scriptFetch({
      'https://a.test/1': { status: 301, location: 'https://a.test/2' },
      'https://a.test/2': { status: 302, location: 'https://a.test/3' },
      'https://a.test/3': { status: 200 },
    })
    const { chain } = await followRedirectChain('https://a.test/1', { fetchFn })
    const text = formatRedirectChain(chain)
    expect(text).toContain('START https://a.test/1')
    expect(text).toContain('1. https://a.test/1\n   HTTP 301 -> Location: https://a.test/2')
    expect(text).toContain('2. https://a.test/2\n   HTTP 302 -> Location: https://a.test/3')
    expect(text).toContain('3. https://a.test/3\n   HTTP 200')
    expect(text).toContain('FINAL URL https://a.test/3')
    expect(text).toContain('FINAL STATUS HTTP 200')
    expect(text).toContain('REDIRECTS 2')
  })
})

describe('headerChainToRedirectChain', () => {
  it('maps webRequest hops to the shared chain shape', () => {
    const chain = headerChainToRedirectChain([
      { url: 'https://a.test/old', status: 301, redirectUrl: 'https://a.test/new' },
      { url: 'https://a.test/new', status: 200 },
    ], 200)
    expect(chain?.hops).toEqual([
      { url: 'https://a.test/old', status: 301, location: 'https://a.test/new' },
      { url: 'https://a.test/new', status: 200 },
    ])
    expect(chain?.finalUrl).toBe('https://a.test/new')
    expect(chain?.finalStatus).toBe(200)
    expect(chain?.redirectCount).toBe(1)
  })

  it('resolves relative Location values and flags loops and downgrades', () => {
    const chain = headerChainToRedirectChain([
      { url: 'https://a.test/x', status: 301, location: '/y' },
      { url: 'https://a.test/y', status: 302, location: 'http://a.test/x' },
      { url: 'https://a.test/x', status: 301, location: '/y' },
    ], undefined)
    expect(chain?.hops[0]?.location).toBe('https://a.test/y')
    expect(chain?.loop).toBe(true)
    expect(chain?.loopUrl).toBe('https://a.test/x')
    expect(chain?.httpDowngrade).toBe(true)
  })

  it('returns null when nothing was captured', () => {
    expect(headerChainToRedirectChain(undefined, 200)).toBeNull()
    expect(headerChainToRedirectChain([], 200)).toBeNull()
  })
})
