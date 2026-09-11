import { beforeEach, describe, expect, it, vi } from 'vitest'

// The shim is hoisted: messages.ts imports the collector, which registers
// chrome.alarms.onAlarm and the probe listeners touch chrome.webRequest at import time.
const { local, session, order } = vi.hoisted(() => {
  const local: Record<string, unknown> = {}
  const session: Record<string, unknown> = {}
  const order: string[] = []
  const keys = (key: string | string[]) => (Array.isArray(key) ? key : [key])
  const area = (store: Record<string, unknown>, name: string) => ({
    get: async (key: string | string[]) => Object.fromEntries(keys(key).map((k) => [k, store[k]])),
    set: async (obj: Record<string, unknown>) => { order.push(`${name}.set:${Object.keys(obj).join(',')}`); Object.assign(store, obj) },
    remove: async (key: string | string[]) => { order.push(`${name}.remove:${keys(key).join(',')}`); for (const k of keys(key)) delete store[k] },
  })
  const event = () => ({ addListener: () => {}, removeListener: () => {} })
  // @ts-expect-error test shim
  globalThis.chrome = {
    alarms: { onAlarm: event(), clear: async () => true, create: async () => {} },
    webRequest: { onBeforeRequest: event(), onBeforeRedirect: event(), onCompleted: event(), onErrorOccurred: event() },
    storage: { local: area(local, 'local'), session: area(session, 'session') },
  }
  return { local, session, order }
})

const clearTabSessionState = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/background/tabCleanup', () => ({ clearTabSessionState: (...args: unknown[]) => { order.push('clearTabSessionState'); return clearTabSessionState(...args as [number, string]) } }))

import { beginManualRun, handleRunStart } from '@/background/manualRunStart'
import { handleMessage } from '@/background/listeners/messages'

beforeEach(() => {
  for (const key of Object.keys(local)) delete local[key]
  for (const key of Object.keys(session)) delete session[key]
  order.length = 0
  clearTabSessionState.mockClear()
})

describe('beginManualRun', () => {
  it('kills the live state first, clears results, records the intent and writes a visible starting meta', async () => {
    local['results:9'] = [{ type: 'ok' }]
    await beginManualRun(9, 'https://example.test/')
    expect(clearTabSessionState).toHaveBeenCalledWith(9, 'manual-run')
    expect(order[0]).toBe('clearTabSessionState')
    expect(order.indexOf('local.remove:results:9')).toBeLessThan(order.indexOf('session.set:audit-manual:9'))
    expect(local['results:9']).toBeUndefined()
    expect(session['audit-manual:9']).toMatchObject({ requestedAt: expect.any(Number) })
    expect(local['results-meta:9']).toEqual({ url: 'https://example.test/', ranAt: expect.any(String), status: 'starting' })
  })
})

describe('panel:run-start message', () => {
  it('is routed to the run start and acknowledged', async () => {
    const reply = vi.fn()
    expect(handleMessage({ t: 'panel:run-start', d: { tabId: 4, url: 'https://example.test/' } }, {} as chrome.runtime.MessageSender, reply)).toBe(true)
    await vi.waitFor(() => expect(reply).toHaveBeenCalledWith({ ok: true }))
    expect((local['results-meta:4'] as { status: string }).status).toBe('starting')
  })

  it('refuses a start without a tab id', () => {
    const reply = vi.fn()
    expect(handleRunStart({}, reply)).toBe(true)
    expect(reply).toHaveBeenCalledWith({ ok: false, error: 'Run start without a tab id' })
  })
})
