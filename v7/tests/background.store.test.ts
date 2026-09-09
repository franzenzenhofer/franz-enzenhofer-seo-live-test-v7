import { describe, it, expect, beforeEach } from 'vitest'

import { addEvent, setDomDone, popRun, RESOURCE_LIMITS } from '@/background/pipeline/store'
import { flushResources } from '@/background/pipeline/storeResources'

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

  it('counts lifecycle callbacks as events, never as extra resources or drops', async () => {
    // One request fires beforeHeaders -> headers -> completed. Ten URLs, three
    // callbacks each: 30 events, 10 resources, zero dropped.
    await addEvent(2, { t: 'nav:before', u: 'https://example.com/' })
    for (let index = 0; index < 10; index++) {
      const u = `https://example.com/r-${index}.js`
      await addEvent(2, { t: 'req:beforeHeaders', u, resourceType: 'script' })
      await addEvent(2, { t: 'req:headers', u, sc: 200, h: { 'content-type': 'text/javascript' } })
      await addEvent(2, { t: 'req:done', u, s: 200, c: false })
    }
    const run = await popRun(2)

    expect(run?.resources?.facts).toHaveLength(10)
    expect(run?.resources?.events).toBe(30)
    expect(run?.resources?.completed).toBe(10)
    expect(run?.resources?.droppedObservations).toBe(0)
    expect(run?.resources?.truncated).toBe(false)
    expect(run?.resources?.facts[0]).toMatchObject({
      url: 'https://example.com/r-0.js', type: 'script', status: 200, fromCache: false,
      headers: { 'content-type': 'text/javascript' },
    })
  })

  it('keeps a failed resource with its error', async () => {
    await addEvent(5, { t: 'nav:before', u: 'https://example.com/' })
    await addEvent(5, { t: 'req:error', u: 'https://example.com/gone.png', resourceType: 'image', error: 'net::ERR_FAILED' })
    const run = await popRun(5)
    expect(run?.resources?.errors).toBe(1)
    expect(run?.resources?.facts[0]).toMatchObject({ url: 'https://example.com/gone.png', error: 'net::ERR_FAILED' })
  })

  it('bounds non-resource event state', async () => {
    for (let index = 0; index < 100; index++) await addEvent(3, { t: `nav:${index}`, u: String(index) })
    const run = await popRun(3)
    expect(run?.ev).toHaveLength(64)
    expect(run?.eventDropped).toBe(36)
  })

  it('bounds tens of thousands of resource events and discloses the truncation', async () => {
    await addEvent(4, { t: 'nav:before', u: 'https://example.com/' })
    for (let index = 0; index < 20_000; index++) {
      await addEvent(4, { t: 'req:done', u: `https://example.com/resource-${index}.js`, s: 200 })
    }
    const run = await popRun(4)

    expect(run?.resources?.events).toBe(20_000)
    expect(run?.resources?.completed).toBe(20_000)
    expect(run?.resources?.facts).toHaveLength(RESOURCE_LIMITS.urls)
    // 19,000 completed responses exist whose URL evidence was not retained -
    // the real number of distinct URLs is unknown, and the ledger says so.
    expect(run?.resources?.droppedObservations).toBe(19_000)
    expect(run?.resources?.truncated).toBe(true)
    expect(run?.resources?.bytes).toBeLessThanOrEqual(1_000_000)
  }, 30_000)

  // Subresource traffic on a tab without a run record is not evidence for
  // anything: it must be dropped, never stored. The old code created a run
  // out of thin air, and the resulting orphan grew until the ledger cap on
  // every open tab - session storage hit its 10 MB quota, the panel broke.
  const sessionKeys = () => Object.keys((chrome.storage.session as unknown as { _d: Record<string, unknown> })._d)

  it('drops a resource event for a tab without a run and writes nothing', async () => {
    const stored = await addEvent(6, { t: 'req:done', u: 'https://example.com/beacon.gif', s: 200 })
    expect(stored).toBe(false)
    expect(sessionKeys()).toEqual([])
  })

  it('does not resurrect a run from post-run subresource traffic', async () => {
    await addEvent(7, { t: 'nav:before', u: 'https://example.com/' })
    await addEvent(7, { t: 'req:done', u: 'https://example.com/app.js', s: 200 })
    await setDomDone(7)
    expect((await popRun(7))?.resources?.facts).toHaveLength(1)

    for (let index = 0; index < RESOURCE_LIMITS.batch * 3; index++) {
      await addEvent(7, { t: 'req:done', u: `https://example.com/poll-${index}`, s: 200 })
    }
    expect(sessionKeys().filter((key) => key.startsWith('run:'))).toEqual([])
    expect(await popRun(7)).toBeNull()
  })

  it('flushResources discards a leftover batch when the tab has no run', async () => {
    await chrome.storage.session.set({ 'run:resources:8': [{ url: 'https://example.com/x.js' }] })
    await flushResources(8)
    expect(sessionKeys()).toEqual([])
  })
})
