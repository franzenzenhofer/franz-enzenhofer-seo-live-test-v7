import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { scheduleFinalize, clearFinalize, onAlarm } from '@/background/pipeline/alarms'

const listeners: Array<(a: { name: string }) => void> = []
// @ts-expect-error test shim
globalThis.chrome = {
  alarms: {
    create: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    onAlarm: { addListener: (fn: (a: { name: string }) => void) => listeners.push(fn) },
  },
}

describe('background alarms', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('fires via the in-process timer at the requested delay, without any alarm event', async () => {
    // chrome.alarms clamps sub-30s alarms to >=30s in packed builds; the timer
    // is the fast path that must fire on its own.
    const fired: number[] = []
    onAlarm((tabId) => { fired.push(tabId) })
    await scheduleFinalize(123, 200)
    vi.advanceTimersByTime(199)
    expect(fired).toEqual([])
    vi.advanceTimersByTime(1)
    expect(fired).toEqual([123])
  })

  it('the timer clears its watchdog alarm when it fires', async () => {
    const clear = chrome.alarms.clear as unknown as ReturnType<typeof vi.fn>
    onAlarm(() => {})
    await scheduleFinalize(127, 200)
    clear.mockClear()
    vi.advanceTimersByTime(200)
    expect(clear).toHaveBeenCalledWith('finalize:127')
  })

  it('the alarm watchdog clears the pending timer so the callback fires once', async () => {
    const fired: number[] = []
    onAlarm((tabId) => { fired.push(tabId) })
    await scheduleFinalize(124, 200)
    listeners.forEach((fn) => fn({ name: 'finalize:124' }))
    vi.advanceTimersByTime(10_000)
    expect(fired).toEqual([124])
  })

  it('clearFinalize cancels the pending timer', async () => {
    const fired: number[] = []
    onAlarm((tabId) => { fired.push(tabId) })
    await scheduleFinalize(125, 200)
    await clearFinalize(125)
    vi.advanceTimersByTime(10_000)
    expect(fired).toEqual([])
  })

  it('rescheduling replaces the previous timer instead of stacking fires', async () => {
    const fired: number[] = []
    onAlarm((tabId) => { fired.push(tabId) })
    await scheduleFinalize(126, 200)
    vi.advanceTimersByTime(100)
    await scheduleFinalize(126, 200)
    vi.advanceTimersByTime(10_000)
    expect(fired).toEqual([126])
  })
})
