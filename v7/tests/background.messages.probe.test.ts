import { describe, expect, it, vi } from 'vitest'

const makeEvent = () => ({ addListener: vi.fn(), removeListener: vi.fn() })
// @ts-expect-error test shim
globalThis.chrome = {
  webRequest: {
    onBeforeRequest: makeEvent(), onBeforeRedirect: makeEvent(),
    onCompleted: makeEvent(), onErrorOccurred: makeEvent(),
  },
}

vi.mock('@/background/pipeline/collector', () => ({ pushEvent: vi.fn().mockResolvedValue(undefined), markDomPhase: vi.fn() }))

import { handleMessage } from '@/background/listeners/messages'
import { handleProbeChainMessage } from '@/background/probes/handler'

describe('messages: probe hop observation routing', () => {
  it('routes offscreen probe messages to the probe handler', () => {
    vi.useFakeTimers()
    const send = vi.fn()
    handleMessage({ channel: 'offscreen', probe: { op: 'start', url: 'https://a.test/p' } }, {} as never, send)
    expect(send).toHaveBeenCalledTimes(1)
    const reply = send.mock.calls[0]?.[0] as { id?: string }
    expect(reply.id).toMatch(/^probe-/)
    // Clean up the started probe so no listeners leak into other tests.
    const stopSend = vi.fn()
    const async = handleProbeChainMessage({ op: 'stop', id: reply.id }, stopSend)
    expect(async).toBe(true)
    vi.advanceTimersByTime(3_000)
    expect(stopSend).toHaveBeenCalledWith({ hops: [], done: false })
    vi.useRealTimers()
  })

  it('leaves plain offscreen channel traffic (run replies) alone', () => {
    const send = vi.fn()
    const handled = handleMessage({ channel: 'offscreen', replyTo: 'x', data: [] }, {} as never, send)
    expect(handled).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
})
