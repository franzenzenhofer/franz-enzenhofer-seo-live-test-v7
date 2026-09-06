import { beforeEach, describe, expect, it } from 'vitest'

import { startSession, abortSession, finishSession, isSessionActive } from '@/background/rules/sessions'

const chromeAny: Record<string, unknown> = {
  storage: {
    session: {
      _d: {} as Record<string, unknown>,
      get(key: string) { return Promise.resolve({ [key]: (this._d as Record<string, unknown>)[key] }) },
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
    expect(await isSessionActive(3, 'run-3')).toBe(true)
  })

  it('aborts and clears session state', async () => {
    await startSession(4, 'run-4')
    await abortSession(4, 'nav')
    expect(await isSessionActive(4, 'run-4')).toBe(false)
  })

  it('auto-aborts previous run when a new session starts', async () => {
    const signal = await startSession(6, 'run-6')
    expect(signal.aborted).toBe(false)
    await startSession(6, 'run-7')
    expect(signal.aborted).toBe(true)
    expect(await isSessionActive(6, 'run-6')).toBe(false)
    expect(await isSessionActive(6, 'run-7')).toBe(true)
  })

  it('finishes session as completed', async () => {
    await startSession(5, 'run-5')
    expect(await finishSession(5, 'completed', 'run-5')).toBe('run-5')
    expect(await isSessionActive(5, 'run-5')).toBe(false)
  })

  it('refuses to finish a session under a different run id', async () => {
    await startSession(7, 'run-a')
    expect(await finishSession(7, 'completed', 'run-old')).toBeNull()
    // Run A stays active: a superseded run's cleanup must not settle it.
    expect(await isSessionActive(7, 'run-a')).toBe(true)
  })
})
