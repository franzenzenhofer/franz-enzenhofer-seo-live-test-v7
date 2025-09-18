import { describe, it, expect, vi } from 'vitest'
import { runPSI } from '@/shared/psi'

describe('PSI caching', () => {
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

