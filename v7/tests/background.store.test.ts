import { describe, it, expect, beforeEach } from 'vitest'

import { addEvent, setDomDone, popRun } from '@/background/pipeline/store'

// minimal chrome.storage.session mock
const chromeAny: Record<string, unknown> = {
  storage: {
    session: {
      _d: {} as Record<string, unknown>,
      get(k: string) { return Promise.resolve({ [k]: (this as { _d: Record<string, unknown> })._d[k] }) },
      set(o: Record<string, unknown>) { Object.assign((this as { _d: Record<string, unknown> })._d, o); return Promise.resolve() },
      remove(k: string) { delete (this as { _d: Record<string, unknown> })._d[k]; return Promise.resolve() },
    },
  },
}
// @ts-expect-error assign test shim
globalThis.chrome = chromeAny

describe('store', () => {
  beforeEach(() => {
    // @ts-expect-error test shim shape
    chrome.storage.session._d = {}
  })

  it('accumulates events and marks dom done', async () => {
    await addEvent(1, { t: 'a' })
    await setDomDone(1)
    const r = await popRun(1)
    expect(r?.ev.length).toBe(1)
    expect(r?.domDone).toBe(true)
  })
})

