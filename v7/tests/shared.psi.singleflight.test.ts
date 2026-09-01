import { describe, it, expect, vi, beforeEach } from 'vitest'

import { runPSI } from '@/shared/psi'

const session = new Map<string, unknown>()

beforeEach(() => {
  session.clear()
  vi.restoreAllMocks()
  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      session: {
        get: async (k: string) => ({ [k]: session.get(k) }),
        set: async (o: Record<string, unknown>) => { Object.entries(o).forEach(([k, v]) => session.set(k, v)) },
      },
    },
  }
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

  it('releases the in-flight entry so later failures can retry', async () => {
    const failing = vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response)
    vi.stubGlobal('fetch', failing)
    await expect(runPSI('https://example.com/', 'mobile', 'K')).rejects.toThrow('PSI 500')
    await expect(runPSI('https://example.com/', 'mobile', 'K')).rejects.toThrow('PSI 500')
    expect(failing).toHaveBeenCalledTimes(2)
  })
})
