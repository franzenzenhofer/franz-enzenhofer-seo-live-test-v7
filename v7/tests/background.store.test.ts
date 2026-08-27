import { describe, it, expect, beforeEach } from 'vitest'

import { addEvent, setDomDone, popRun, RESOURCE_LIMITS } from '@/background/pipeline/store'

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

  it('deduplicates resources in bounded batches while retaining totals', async () => {
    for (let index = 0; index < RESOURCE_LIMITS.batch * 2; index++) {
      await addEvent(2, { t: 'req:headers', u: `https://example.com/r-${index % 10}.js` })
    }
    const run = await popRun(2)

    expect(run?.resources?.urls).toHaveLength(10)
    expect(run?.resources?.total).toBe(RESOURCE_LIMITS.batch * 2)
    expect(run?.resources?.dropped).toBe(RESOURCE_LIMITS.batch * 2 - 10)
  })

  it('bounds non-resource event state', async () => {
    for (let index = 0; index < 100; index++) await addEvent(3, { t: `nav:${index}`, u: String(index) })
    const run = await popRun(3)
    expect(run?.ev).toHaveLength(64)
    expect(run?.eventDropped).toBe(36)
  })

  it('bounds tens of thousands of resource events', async () => {
    for (let index = 0; index < 20_000; index++) {
      await addEvent(4, { t: 'req:headers', u: `https://example.com/resource-${index}.js` })
    }
    const run = await popRun(4)

    expect(run?.resources?.total).toBe(20_000)
    expect(run?.resources?.urls).toHaveLength(RESOURCE_LIMITS.urls)
    expect(run?.resources?.dropped).toBe(19_000)
  }, 30_000)
})
