import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => { vi.resetModules(); vi.restoreAllMocks() })


describe('deriveGscProperty single-flight', () => {
  it('collapses the six concurrent GSC rules onto one derivation', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (u: string) => {
      calls.push(u)
      await new Promise((r) => setTimeout(r, 10))
      return { ok: u.includes('sc-domain') } as Response
    }))
    const { deriveGscProperty } = await import('@/rules/google/google-gsc-utils')

    const results = await Promise.all(
      Array.from({ length: 6 }, () => deriveGscProperty('https://orf.at/stories/1/', 'tok')),
    )

    // One derivation: two probes (url-prefix + domain), run in parallel.
    expect(calls).toHaveLength(2)
    expect(results.every((r) => r?.property === 'sc-domain:orf.at')).toBe(true)
  })

  it('prefers a url-prefix property when both exist', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true }) as Response))
    const { deriveGscProperty } = await import('@/rules/google/google-gsc-utils')
    const got = await deriveGscProperty('https://orf.at/stories/1/', 'tok')
    expect(got).toEqual({ property: 'https://orf.at/', type: 'url-prefix' })
  })

  it('probes both candidates concurrently, not one after the other', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u: string) => {
      await new Promise((r) => setTimeout(r, 60))
      return { ok: u.includes('sc-domain') } as Response
    }))
    const { deriveGscProperty } = await import('@/rules/google/google-gsc-utils')
    const t0 = Date.now()
    await deriveGscProperty('https://orf.at/stories/1/', 'tok')
    // Serial would be >=120ms for the domain-property case.
    expect(Date.now() - t0).toBeLessThan(115)
  })

  it('serves later callers from cache without new requests', async () => {
    const fetchMock = vi.fn(async (u: string) => ({ ok: u.includes('sc-domain') }) as Response)
    vi.stubGlobal('fetch', fetchMock)
    const { deriveGscProperty } = await import('@/rules/google/google-gsc-utils')
    await deriveGscProperty('https://orf.at/a', 'tok')
    const before = fetchMock.mock.calls.length
    await deriveGscProperty('https://orf.at/b', 'tok')
    expect(fetchMock.mock.calls.length).toBe(before)
  })
})
