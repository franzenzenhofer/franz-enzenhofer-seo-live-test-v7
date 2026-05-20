import { beforeEach, describe, expect, it, vi } from 'vitest'

import { incr, snapshot, __test } from '@/shared/telemetry'

describe('telemetry counters', () => {
  beforeEach(() => {
    __test.local.clear()
    // @ts-expect-error test shim
    globalThis.chrome = {
      storage: { session: { set: vi.fn(async () => undefined) } },
    }
  })

  it('starts empty and increments on demand', () => {
    expect(snapshot()).toEqual({})
    incr('sw.wakeups')
    incr('msg.in', 3)
    expect(snapshot()).toEqual({ 'sw.wakeups': 1, 'msg.in': 3 })
  })

  it('flush writes the current snapshot to chrome.storage.session', async () => {
    incr('crashnet.fired')
    await __test.flush()
    const setCalls = (globalThis.chrome.storage.session.set as ReturnType<typeof vi.fn>).mock.calls
    expect(setCalls.length).toBe(1)
    expect(setCalls[0][0]).toEqual({ [__test.STORAGE_KEY]: { 'crashnet.fired': 1 } })
  })

  it('flush tolerates chrome being unavailable', async () => {
    // @ts-expect-error test shim
    delete globalThis.chrome
    await expect(__test.flush()).resolves.toBeUndefined()
  })
})
