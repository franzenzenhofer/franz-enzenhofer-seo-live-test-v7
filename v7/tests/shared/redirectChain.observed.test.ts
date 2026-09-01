import { describe, expect, it, vi } from 'vitest'

import { chainResponse, scriptFetch } from '../helpers/redirectFetch'

import { followRedirectChain } from '@/shared/redirectChain'
import { getRedirectHopObserver } from '@/shared/redirectChainObserver'
import type { ObservedHops, RedirectHop, RedirectHopObserver } from '@/shared/redirectChainTypes'

const observerOf = (hops: RedirectHop[], done = true): RedirectHopObserver & { stopped: string[] } => {
  const stopped: string[] = []
  return {
    stopped,
    start: vi.fn(async () => 'probe-1'),
    stop: vi.fn(async (id: string): Promise<ObservedHops> => { stopped.push(id); return { hops, done } }),
  }
}

const followFetch = (status: number, url: string, redirected = false): typeof fetch =>
  vi.fn(async () => ({ ...chainResponse(url, { status, url }), redirected })) as unknown as typeof fetch

describe('followRedirectChain via runtime hop observer (extension path)', () => {
  it('returns the real per-hop chain that MV3 fetch() hides', async () => {
    const observer = observerOf([
      { url: 'https://a.test/probe', status: 301, location: 'https://a.test/mid' },
      { url: 'https://a.test/mid', status: 301, location: 'https://b.test/end' },
      { url: 'https://b.test/end', status: 404 },
    ])
    const fetchFn = followFetch(404, 'https://b.test/end', true)
    const { chain } = await followRedirectChain('https://a.test/probe', { fetchFn, observer })
    expect(chain.hops.map((h) => h.status)).toEqual([301, 301, 404])
    expect(chain.hops[0]?.location).toBe('https://a.test/mid')
    expect(chain.redirectCount).toBe(2)
    expect(chain.redirected).toBe(true)
    expect(chain.finalUrl).toBe('https://b.test/end')
    expect(chain.finalStatus).toBe(404)
    expect(chain.hopsHidden).toBe(false)
    expect(chain.note).toBeUndefined()
    expect(observer.stopped).toEqual(['probe-1'])
    // The follow fetch is the only network walk - one request, redirect:'follow'.
    expect((fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.redirect).toBe('follow')
  })

  it('reports a direct response with no redirects', async () => {
    const observer = observerOf([{ url: 'https://a.test/direct', status: 200 }])
    const { chain } = await followRedirectChain('https://a.test/direct', { fetchFn: followFetch(200, 'https://a.test/direct'), observer })
    expect(chain.redirectCount).toBe(0)
    expect(chain.redirected).toBe(false)
    expect(chain.finalStatus).toBe(200)
  })

  it('detects a loop from observed hops even though the follow fetch fails', async () => {
    const observer = observerOf([
      { url: 'https://a.test/x', status: 301, location: 'https://a.test/y' },
      { url: 'https://a.test/y', status: 301, location: 'https://a.test/x' },
    ], true)
    const fetchFn = vi.fn(async () => { throw new Error('net::ERR_TOO_MANY_REDIRECTS') }) as unknown as typeof fetch
    const { chain } = await followRedirectChain('https://a.test/x', { fetchFn, observer })
    expect(chain.loop).toBe(true)
    expect(chain.loopUrl).toBe('https://a.test/x')
    expect(chain.hops).toHaveLength(2)
  })

  it('caps a runaway observed chain at maxHops', async () => {
    const hops: RedirectHop[] = Array.from({ length: 15 }, (_, i) => (
      { url: `https://a.test/${i}`, status: 301, location: `https://a.test/${i + 1}` }
    ))
    const observer = observerOf(hops, false)
    const { chain } = await followRedirectChain('https://a.test/0', { fetchFn: followFetch(200, 'https://a.test/15'), observer, maxHops: 10 })
    expect(chain.capped).toBe(true)
    expect(chain.redirectCount).toBe(10)
    expect(chain.hops).toHaveLength(10)
  })

  it('closes an unterminated observation with the follow response', async () => {
    const observer = observerOf([
      { url: 'https://a.test/probe', status: 302, location: 'https://a.test/end' },
    ], false)
    const { chain } = await followRedirectChain('https://a.test/probe', { fetchFn: followFetch(200, 'https://a.test/end', true), observer })
    expect(chain.hops).toEqual([
      { url: 'https://a.test/probe', status: 302, location: 'https://a.test/end' },
      { url: 'https://a.test/end', status: 200 },
    ])
    expect(chain.finalStatus).toBe(200)
  })

  it('degrades loudly when the observer saw nothing but the response redirected', async () => {
    const observer = observerOf([])
    const { chain } = await followRedirectChain('https://a.test/probe', { fetchFn: followFetch(200, 'https://a.test/end', true), observer })
    expect(chain.hopsHidden).toBe(true)
    expect(chain.redirected).toBe(true)
    expect(chain.note).toContain('webRequest captured no events')
    expect(chain.finalStatus).toBe(200)
  })

  it('falls back to the manual fetch walk when observation cannot start', async () => {
    const observer: RedirectHopObserver = {
      start: vi.fn(async () => { throw new Error('probe-observer-no-reply') }),
      stop: vi.fn(),
    }
    const fetchFn = scriptFetch({
      'https://a.test/old': { status: 301, location: 'https://a.test/new' },
      'https://a.test/new': { status: 200 },
    })
    const { chain } = await followRedirectChain('https://a.test/old', { fetchFn, observer })
    expect(chain.hops.map((h) => h.status)).toEqual([301, 200])
    expect((fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.redirect).toBe('manual')
  })

  it('throws with the captured hops when the follow fetch fails mid-chain', async () => {
    const observer = observerOf([
      { url: 'https://a.test/probe', status: 301, location: 'https://dead.test/' },
    ], true)
    const fetchFn = vi.fn(async () => { throw new Error('dns fail') }) as unknown as typeof fetch
    await expect(followRedirectChain('https://a.test/probe', { fetchFn, observer })).rejects.toMatchObject({
      name: 'RedirectChainError',
      hops: [{ url: 'https://a.test/probe', status: 301, location: 'https://dead.test/' }],
    })
  })

  it('Node/CLI path: no observer is registered, the manual fetch walk runs unchanged', async () => {
    expect(getRedirectHopObserver()).toBeNull()
    const fetchFn = scriptFetch({
      'https://a.test/old': { status: 308, location: 'https://a.test/new' },
      'https://a.test/new': { status: 200 },
    })
    const { chain } = await followRedirectChain('https://a.test/old', { fetchFn })
    expect(chain.hops.map((h) => h.status)).toEqual([308, 200])
    expect((fetchFn as ReturnType<typeof vi.fn>).mock.calls.every((c) => c[1]?.redirect === 'manual')).toBe(true)
  })
})
