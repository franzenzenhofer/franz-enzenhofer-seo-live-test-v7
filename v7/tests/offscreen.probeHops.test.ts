import { afterEach, describe, expect, it, vi } from 'vitest'

import { installProbeHopObserver } from '@/offscreen/probeHops'
import { getRedirectHopObserver, setRedirectHopObserver } from '@/shared/redirectChainObserver'

const sendMessage = vi.fn()
// @ts-expect-error test shim
globalThis.chrome = { runtime: { sendMessage } }

describe('offscreen probe hop observer transport', () => {
  afterEach(() => {
    setRedirectHopObserver(null)
    sendMessage.mockReset()
  })

  it('registers an observer that talks over the offscreen channel', async () => {
    installProbeHopObserver()
    const observer = getRedirectHopObserver()
    expect(observer).not.toBeNull()
    sendMessage.mockResolvedValueOnce({ id: 'probe-9' })
    const id = await observer!.start('https://a.test/probe')
    expect(id).toBe('probe-9')
    expect(sendMessage).toHaveBeenCalledWith({ channel: 'offscreen', probe: { op: 'start', url: 'https://a.test/probe' } })
    const hops = [{ url: 'https://a.test/probe', status: 301, location: 'https://a.test/x' }]
    sendMessage.mockResolvedValueOnce({ hops, done: true })
    const observed = await observer!.stop('probe-9')
    expect(sendMessage).toHaveBeenCalledWith({ channel: 'offscreen', probe: { op: 'stop', id: 'probe-9' } })
    expect(observed).toEqual({ hops, done: true })
  })

  it('start fails loudly when the service worker does not answer or errors', async () => {
    installProbeHopObserver()
    const observer = getRedirectHopObserver()!
    sendMessage.mockResolvedValueOnce(undefined)
    await expect(observer.start('https://a.test/1')).rejects.toThrow('probe-observer-no-reply')
    sendMessage.mockResolvedValueOnce({ error: 'probe-bad-request' })
    await expect(observer.start('https://a.test/2')).rejects.toThrow('probe-bad-request')
    sendMessage.mockResolvedValueOnce({})
    await expect(observer.start('https://a.test/3')).rejects.toThrow('probe-observer-no-id')
  })
})
