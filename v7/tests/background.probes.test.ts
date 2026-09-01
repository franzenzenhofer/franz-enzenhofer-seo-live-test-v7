import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Fired = Record<string, unknown>
const makeEvent = () => {
  const listeners = new Set<(details: Fired) => void>()
  return {
    addListener: vi.fn((fn: (details: Fired) => void) => listeners.add(fn)),
    removeListener: vi.fn((fn: (details: Fired) => void) => listeners.delete(fn)),
    fire: (details: Fired) => [...listeners].forEach((fn) => fn(details)),
    size: () => listeners.size,
  }
}

const webRequest = {
  onBeforeRequest: makeEvent(),
  onBeforeRedirect: makeEvent(),
  onCompleted: makeEvent(),
  onErrorOccurred: makeEvent(),
}
// @ts-expect-error test shim
globalThis.chrome = { webRequest }

import { handleProbeChainMessage } from '@/background/probes/handler'
import { probeListenersRegistered } from '@/background/probes/listeners'
import { probeCount } from '@/background/probes/state'
import type { RedirectHop } from '@/shared/redirectChainTypes'

type StopReply = { hops: RedirectHop[]; done: boolean; error?: string }
const start = (url: string): string => {
  let id = ''
  handleProbeChainMessage({ op: 'start', url }, (reply) => { id = (reply as { id: string }).id })
  return id
}
const stop = (id: string): Promise<StopReply> =>
  new Promise((resolve) => { handleProbeChainMessage({ op: 'stop', id }, (reply) => resolve(reply as StopReply)) })

const drain = async (): Promise<void> => { await Promise.resolve() }

describe('background probe hop observer', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(async () => {
    // Every test must leave zero probes and zero listeners behind.
    vi.runAllTimers()
    await drain()
    expect(probeCount()).toBe(0)
    expect(probeListenersRegistered()).toBe(false)
    vi.useRealTimers()
  })

  it('captures a 2-hop redirect chain for a probe request', async () => {
    const id = start('https://a.test/probe')
    expect(probeListenersRegistered()).toBe(true)
    webRequest.onBeforeRequest.fire({ requestId: 'r1', url: 'https://a.test/probe' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r1', url: 'https://a.test/probe', statusCode: 301, redirectUrl: 'https://a.test/mid' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r1', url: 'https://a.test/mid', statusCode: 302, redirectUrl: 'https://b.test/end' })
    webRequest.onCompleted.fire({ requestId: 'r1', url: 'https://b.test/end', statusCode: 404 })
    const reply = await stop(id)
    expect(reply.done).toBe(true)
    expect(reply.hops).toEqual([
      { url: 'https://a.test/probe', status: 301, location: 'https://a.test/mid' },
      { url: 'https://a.test/mid', status: 302, location: 'https://b.test/end' },
      { url: 'https://b.test/end', status: 404 },
    ])
  })

  it('captures a request that never redirects', async () => {
    const id = start('https://a.test/direct')
    webRequest.onBeforeRequest.fire({ requestId: 'r2', url: 'https://a.test/direct' })
    webRequest.onCompleted.fire({ requestId: 'r2', url: 'https://a.test/direct', statusCode: 200 })
    const reply = await stop(id)
    expect(reply.done).toBe(true)
    expect(reply.hops).toEqual([{ url: 'https://a.test/direct', status: 200 }])
  })

  it('keeps concurrent probes separated - even for the same URL', async () => {
    const idA = start('https://a.test/same')
    const idB = start('https://a.test/same')
    webRequest.onBeforeRequest.fire({ requestId: 'ra', url: 'https://a.test/same' })
    webRequest.onBeforeRequest.fire({ requestId: 'rb', url: 'https://a.test/same' })
    webRequest.onBeforeRedirect.fire({ requestId: 'ra', url: 'https://a.test/same', statusCode: 301, redirectUrl: 'https://a.test/one' })
    webRequest.onCompleted.fire({ requestId: 'ra', url: 'https://a.test/one', statusCode: 200 })
    webRequest.onBeforeRedirect.fire({ requestId: 'rb', url: 'https://a.test/same', statusCode: 302, redirectUrl: 'https://a.test/two' })
    webRequest.onCompleted.fire({ requestId: 'rb', url: 'https://a.test/two', statusCode: 404 })
    const [replyA, replyB] = [await stop(idA), await stop(idB)]
    expect(replyA.hops.map((h) => h.location ?? h.url)).toEqual(['https://a.test/one', 'https://a.test/one'])
    expect(replyB.hops.map((h) => h.location ?? h.url)).toEqual(['https://a.test/two', 'https://a.test/two'])
    expect(replyA.hops[0]?.status).toBe(301)
    expect(replyB.hops[0]?.status).toBe(302)
  })

  it('a redirect target re-request never claims a second probe', async () => {
    const idA = start('https://a.test/start')
    const idB = start('https://a.test/target')
    webRequest.onBeforeRequest.fire({ requestId: 'r5', url: 'https://a.test/start' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r5', url: 'https://a.test/start', statusCode: 301, redirectUrl: 'https://a.test/target' })
    // Chrome re-fires onBeforeRequest for the redirect target with the SAME requestId.
    webRequest.onBeforeRequest.fire({ requestId: 'r5', url: 'https://a.test/target' })
    webRequest.onCompleted.fire({ requestId: 'r5', url: 'https://a.test/target', statusCode: 200 })
    const replyA = await stop(idA)
    expect(replyA.hops).toHaveLength(2)
    const pendingB = stop(idB)
    vi.advanceTimersByTime(3_000)
    const replyB = await pendingB
    expect(replyB.hops).toEqual([])
  })

  it('resolves a pending stop when the terminal event arrives late', async () => {
    const id = start('https://a.test/late')
    webRequest.onBeforeRequest.fire({ requestId: 'r6', url: 'https://a.test/late' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r6', url: 'https://a.test/late', statusCode: 301, redirectUrl: 'https://a.test/done' })
    const pending = stop(id)
    webRequest.onCompleted.fire({ requestId: 'r6', url: 'https://a.test/done', statusCode: 200 })
    const reply = await pending
    expect(reply.done).toBe(true)
    expect(reply.hops).toHaveLength(2)
  })

  it('answers a pending stop with the captured hops after the grace period', async () => {
    const id = start('https://a.test/hang')
    webRequest.onBeforeRequest.fire({ requestId: 'r7', url: 'https://a.test/hang' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r7', url: 'https://a.test/hang', statusCode: 302, redirectUrl: 'https://a.test/x' })
    const pending = stop(id)
    vi.advanceTimersByTime(3_000)
    const reply = await pending
    expect(reply.done).toBe(false)
    expect(reply.hops).toHaveLength(1)
  })

  it('marks a network-failed request done and keeps its hops', async () => {
    const id = start('https://a.test/loop')
    webRequest.onBeforeRequest.fire({ requestId: 'r8', url: 'https://a.test/loop' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r8', url: 'https://a.test/loop', statusCode: 301, redirectUrl: 'https://a.test/back' })
    webRequest.onBeforeRedirect.fire({ requestId: 'r8', url: 'https://a.test/back', statusCode: 301, redirectUrl: 'https://a.test/loop' })
    webRequest.onErrorOccurred.fire({ requestId: 'r8', url: 'https://a.test/loop', error: 'net::ERR_TOO_MANY_REDIRECTS' })
    const reply = await stop(id)
    expect(reply.done).toBe(true)
    expect(reply.hops.map((h) => h.status)).toEqual([301, 301])
  })

  it('removes the shared listeners once the last probe stops', async () => {
    const idA = start('https://a.test/1')
    const idB = start('https://a.test/2')
    expect(webRequest.onBeforeRedirect.size()).toBe(1)
    webRequest.onBeforeRequest.fire({ requestId: 'r9', url: 'https://a.test/1' })
    webRequest.onCompleted.fire({ requestId: 'r9', url: 'https://a.test/1', statusCode: 200 })
    webRequest.onBeforeRequest.fire({ requestId: 'r10', url: 'https://a.test/2' })
    webRequest.onCompleted.fire({ requestId: 'r10', url: 'https://a.test/2', statusCode: 200 })
    await stop(idA)
    expect(probeListenersRegistered()).toBe(true)
    await stop(idB)
    expect(probeListenersRegistered()).toBe(false)
    expect(webRequest.onBeforeRequest.size()).toBe(0)
    expect(webRequest.onBeforeRedirect.size()).toBe(0)
    expect(webRequest.onCompleted.size()).toBe(0)
    expect(webRequest.onErrorOccurred.size()).toBe(0)
  })

  it('purges an abandoned probe and its listeners after its lifetime', () => {
    start('https://a.test/abandoned')
    expect(probeCount()).toBe(1)
    vi.advanceTimersByTime(60_000)
    expect(probeCount()).toBe(0)
    expect(probeListenersRegistered()).toBe(false)
  })

  it('answers an unknown stop id and a malformed request with errors', async () => {
    const reply = await stop('probe-nope')
    expect(reply.error).toBe('probe-not-found')
    let bad: unknown
    handleProbeChainMessage({ op: 'weird' }, (r) => { bad = r })
    expect(bad).toEqual({ error: 'probe-bad-request' })
  })
})
