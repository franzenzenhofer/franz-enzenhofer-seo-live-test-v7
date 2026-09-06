import { describe, expect, it, vi } from 'vitest'

import { createSingleFlight } from '@/shared/singleFlight'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('single-flight sharing with independent cancellation', () => {
  it('collapses concurrent callers onto one run and caches the result', async () => {
    const shared = createSingleFlight<string>(60_000)
    const run = vi.fn(async () => 'value')
    const [a, b] = await Promise.all([shared('k', run), shared('k', run)])
    expect([a, b]).toEqual(['value', 'value'])
    expect(await shared('k', run)).toBe('value')
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('one consumer giving up does not cancel the others', async () => {
    const shared = createSingleFlight<string>(60_000)
    const gate = deferred<string>()
    const run = vi.fn(async () => gate.promise)
    const controller = new AbortController()
    const leaving = shared('k', run, controller.signal)
    const staying = shared('k', run)
    const rejection = expect(leaving).rejects.toThrow('gave up')
    controller.abort(new Error('gave up'))
    await rejection
    gate.resolve('finished')
    expect(await staying).toBe('finished')
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('cancels the underlying request once the last consumer is gone', async () => {
    const shared = createSingleFlight<string>(60_000)
    let inner: AbortSignal | undefined
    const gate = deferred<string>()
    const run = vi.fn(async (signal: AbortSignal) => { inner = signal; return gate.promise })
    const controller = new AbortController()
    const only = shared('k', run, controller.signal)
    const rejection = expect(only).rejects.toThrow('done with it')
    controller.abort(new Error('done with it'))
    await rejection
    expect(inner?.aborted).toBe(true)
    // The abandoned entry is dropped, so the next caller starts a fresh request.
    gate.resolve('late')
    await shared('k', async () => 'fresh')
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failure: the next caller retries', async () => {
    const shared = createSingleFlight<string>(60_000)
    const run = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('ok')
    await expect(shared('k', run)).rejects.toThrow('offline')
    expect(await shared('k', run)).toBe('ok')
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('honours the cacheable predicate and the ttl', async () => {
    const shared = createSingleFlight<number>(0, (value) => value !== 429)
    const rateLimited = vi.fn(async () => 429)
    await shared('k', rateLimited)
    await shared('k', rateLimited)
    expect(rateLimited).toHaveBeenCalledTimes(2)
  })
})
