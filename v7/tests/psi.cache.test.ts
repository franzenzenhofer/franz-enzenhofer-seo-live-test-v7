import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runPSI } from '@/shared/psi'

describe('PSI caching', () => {
  beforeEach(() => {
    const storage: Record<string, unknown> = {}
    // @ts-expect-error test shim
    globalThis.chrome = {
      storage: {
        session: {
          get: async (key: string) => ({ [key]: storage[key] }),
          set: async (obj: Record<string, unknown>) => { Object.assign(storage, obj) },
        },
      },
    }
  })

  it('caches within 5 minutes per url+strategy', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: true, json: async ()=> ({ lighthouseResult: { categories: { performance: { score: 0.9 } } } }) })
    const key = 'k'
    await runPSI('https://ex.com', 'mobile', key)
    await runPSI('https://ex.com', 'mobile', key)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 5 * 60_000 + 1000)
    await runPSI('https://ex.com', 'mobile', key)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    fetchSpy.mockRestore(); vi.useRealTimers()
  })
})

