import { describe, it, expect, vi, beforeEach } from 'vitest'

import { runPSI } from '@/shared/psi'

// The offscreen document, where the PSI rules run, exposes chrome.runtime only - no
// chrome.storage. Delete the global entirely so the tests run under the same conditions.
beforeEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as { chrome?: unknown }).chrome
})

const psiBody = { lighthouseResult: { categories: { performance: { score: 0.5 } } } }

describe('runPSI single-flight', () => {
  it('collapses concurrent identical requests into one fetch', async () => {
    const fetchMock = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20))
      return { ok: true, json: async () => psiBody } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    // psi:mobile and psi:mobile-fcp-tbt both ask for the same mobile report.
    const [a, b] = await Promise.all([
      runPSI('https://example.com/', 'mobile', 'K'),
      runPSI('https://example.com/', 'mobile', 'K'),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a).toEqual(b)
  })

  it('still issues separate requests per strategy', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => psiBody }) as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)
    await Promise.all([
      runPSI('https://example.com/', 'mobile', 'K'),
      runPSI('https://example.com/', 'desktop', 'K'),
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('still issues separate requests per api key', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => psiBody }) as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)
    await Promise.all([
      runPSI('https://example.com/', 'mobile', 'K1'),
      runPSI('https://example.com/', 'mobile', 'K2'),
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('releases the in-flight entry once settled so the next call fetches again', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => psiBody }) as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)
    await runPSI('https://example.com/', 'mobile', 'K')
    await runPSI('https://example.com/', 'mobile', 'K')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('releases the in-flight entry so later failures can retry', async () => {
    const failing = vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response)
    vi.stubGlobal('fetch', failing)
    await expect(runPSI('https://example.com/', 'mobile', 'K')).rejects.toThrow('PSI 500')
    await expect(runPSI('https://example.com/', 'mobile', 'K')).rejects.toThrow('PSI 500')
    expect(failing).toHaveBeenCalledTimes(2)
  })
})
