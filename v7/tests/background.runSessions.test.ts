import { beforeEach, describe, expect, it } from 'vitest'

import { startSession, abortSession, finishSession, isSessionActive } from '@/background/rules/sessions'

const chromeAny: Record<string, unknown> = {
  storage: {
    session: {
      _d: {} as Record<string, unknown>,
      set(obj: Record<string, unknown>) { Object.assign(this._d as Record<string, unknown>, obj); return Promise.resolve() },
      remove(key: string) { delete (this._d as Record<string, unknown>)[key]; return Promise.resolve() },
    },
  },
}

describe('run sessions', () => {
  beforeEach(() => {
    // @ts-expect-error test shim
    chromeAny.storage.session._d = {}
    // @ts-expect-error assign test shim
    globalThis.chrome = { storage: chromeAny.storage }
  })

  it('tracks active session per tab', async () => {
    await startSession(3, 'run-3')
    expect(isSessionActive(3, 'run-3')).toBe(true)
  })

  it('aborts and clears session state', async () => {
    await startSession(4, 'run-4')
    await abortSession(4, 'nav')
    expect(isSessionActive(4, 'run-4')).toBe(false)
  })

  it('finishes session as completed', async () => {
    await startSession(5, 'run-5')
    await finishSession(5, 'completed')
    expect(isSessionActive(5, 'run-5')).toBe(false)
  })
})
