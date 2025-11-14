import { describe, it, expect, beforeEach, vi } from 'vitest'

const makeSession = () => ({
  get: vi.fn(async () => ({})),
  set: vi.fn(async () => {}),
})

let session: ReturnType<typeof makeSession>

beforeEach(() => {
  session = makeSession()
  // @ts-expect-error test shim
  globalThis.chrome = {
    storage: {
      session,
    },
  }
})

import { log } from '@/shared/logs'

describe('shared/logs tab validation', () => {
  it('throws on invalid tab ids', async () => {
    await expect(log(-1, 'nope')).rejects.toThrow('[logs] Invalid tabId')
    expect(session.set).not.toHaveBeenCalled()
  })

  it('stores logs for valid tabs', async () => {
    await log(7, 'ok')
    expect(session.set).toHaveBeenCalledWith({ 'logs:7': expect.any(Array) })
  })
})
