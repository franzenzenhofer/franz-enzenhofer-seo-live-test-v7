import { describe, expect, it, vi } from 'vitest'

import { withQuotaRetry, __retry } from '@/shared/storage-retry'

describe('storage-retry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn(async () => 'ok')
    const result = await withQuotaRetry('test', fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledOnce()
  })

  it('rethrows non-quota errors without retry', async () => {
    const fn = vi.fn(async () => { throw new Error('TypeError: bad arg') })
    await expect(withQuotaRetry('test', fn)).rejects.toThrow(/bad arg/)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('retries quota-shaped errors up to BACKOFFS_MS.length times', async () => {
    let attempts = 0
    const fn = vi.fn(async () => {
      attempts++
      if (attempts <= 2) throw new Error('QUOTA_BYTES exceeded')
      return 'ok'
    })
    const result = await withQuotaRetry('test', fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('gives up after the final backoff', async () => {
    const fn = vi.fn(async () => { throw new Error('QUOTA_BYTES exceeded') })
    await expect(withQuotaRetry('test', fn)).rejects.toThrow(/QUOTA_BYTES/)
    expect(fn).toHaveBeenCalledTimes(__retry.BACKOFFS_MS.length + 1)
  })
})
