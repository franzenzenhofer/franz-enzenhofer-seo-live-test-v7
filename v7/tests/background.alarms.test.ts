import { describe, it, expect } from 'vitest'

import { scheduleFinalize, onAlarm } from '@/background/pipeline/alarms'

describe('background alarms', () => {
  it('schedules finalize and listens to onAlarm', async () => {
    const fired: number[] = []
    // minimal mock
    const listeners: Array<(a: { name: string }) => void> = []
    // @ts-expect-error test shim
    globalThis.chrome = {
      alarms: {
        create: async (_name: string, _info: unknown) => {},
        onAlarm: { addListener: (fn: (a: { name: string }) => void) => listeners.push(fn) },
      },
    }
    onAlarm((tabId) => fired.push(tabId))
    await scheduleFinalize(123, 1)
    // trigger
    listeners.forEach((fn) => fn({ name: 'finalize:123' }))
    expect(fired).toEqual([123])
  })
})

