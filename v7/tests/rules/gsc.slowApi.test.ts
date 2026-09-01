import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => { vi.resetModules(); vi.restoreAllMocks() })

const store: Record<string, unknown> = {}
const stubChrome = () => {
  Object.keys(store).forEach((k) => delete store[k])
  vi.stubGlobal('chrome', {
    storage: {
      session: {
        get: async (k: string) => ({ [k]: store[k] }),
        set: async (o: Record<string, unknown>) => { Object.assign(store, o) },
      },
    },
  })
}

/**
 * The authenticated path: a real token means the GSC rules actually call
 * googleapis. Every one of them waits on the same shared property derivation,
 * so an unresponsive Google leaves all six showing "Running..." together for as
 * long as it takes. It must be bounded.
 */
describe('GSC against a slow Google API', () => {
  it('gives up on property derivation instead of hanging all six rules', async () => {
    stubChrome()
    // Google accepts the connection and never answers.
    vi.stubGlobal('fetch', vi.fn((_u: string, init?: RequestInit) => new Promise<Response>((_res, rej) => {
      init?.signal?.addEventListener('abort', () => rej(new Error('aborted')))
    })))
    const { deriveGscProperty, GSC_PROBE_TIMEOUT_MS } = await import('@/rules/google/gscProperty')

    const started = Date.now()
    const all = await Promise.all(Array.from({ length: 6 }, () => deriveGscProperty('https://orf.at/x', 'tok')))
    const elapsed = Date.now() - started

    expect(all.every((r) => r === null)).toBe(true)
    expect(elapsed).toBeLessThan(GSC_PROBE_TIMEOUT_MS + 2000)
  }, 30_000)

  it('reuses a derived property across runs instead of re-probing every time', async () => {
    stubChrome()
    const fetchMock = vi.fn(async (u: string) => ({ ok: String(u).includes('sc-domain') }) as Response)
    vi.stubGlobal('fetch', fetchMock)
    const first = await import('@/rules/google/gscProperty')
    await first.deriveGscProperty('https://orf.at/a', 'tok')
    const afterFirst = fetchMock.mock.calls.length
    expect(afterFirst).toBe(2)

    // A later run gets a fresh offscreen document, so the in-memory cache is
    // gone; the persisted one must still save the round trips.
    vi.resetModules()
    const second = await import('@/rules/google/gscProperty')
    const again = await second.deriveGscProperty('https://orf.at/b', 'tok')
    expect(again?.property).toBe('sc-domain:orf.at')
    expect(fetchMock.mock.calls.length).toBe(afterFirst)
  })
})

describe('GSC query timeout', () => {
  it('fails a hanging Search Console query loudly instead of holding the row', async () => {
    vi.stubGlobal('fetch', vi.fn((_u: string, init?: RequestInit) => new Promise<Response>((_res, rej) => {
      init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
    })))
    const { gscFetch, GSC_QUERY_TIMEOUT_MS } = await import('@/rules/google/googleFetch')
    const started = Date.now()
    await expect(gscFetch('https://www.googleapis.com/x', {})).rejects.toThrow(/did not respond within/)
    expect(Date.now() - started).toBeLessThan(GSC_QUERY_TIMEOUT_MS + 2000)
  }, 30_000)

  it('passes a normal response straight through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 }) as Response))
    const { gscFetch } = await import('@/rules/google/googleFetch')
    expect((await gscFetch('https://www.googleapis.com/x', {})).status).toBe(200)
  })
})
