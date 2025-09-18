import { describe, it, expect, vi } from 'vitest'

import { vi, describe, it, expect } from 'vitest'

// Minimal chrome shim must be installed and modules mocked before importing the listener
// @ts-expect-error test shim
globalThis.chrome = { alarms: { onAlarm: { addListener: () => {} }, create: async () => {} } }

vi.mock('@/background/pipeline/store', () => ({ setDomDone: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/background/pipeline/alarms', () => ({
  scheduleFinalize: vi.fn().mockResolvedValue(undefined),
  onAlarm: (_cb: (tabId: number) => void) => {},
}))

import { handleMessage } from '@/background/listeners/messages'
import * as store from '@/background/pipeline/store'
import * as alarms from '@/background/pipeline/alarms'

describe('messages: panel:runNow', () => {
  it('marks dom done and schedules finalize', async () => {
    const sd = store.setDomDone as unknown as ReturnType<typeof vi.fn>
    const sf = alarms.scheduleFinalize as unknown as ReturnType<typeof vi.fn>
    let replied = ''
    await new Promise<void>((res) => {
      handleMessage({ type: 'panel:runNow', tabId: 9 }, { tab: { id: 9 } } as any, (r) => { replied = String(r); res() })
    })
    expect(sd).toHaveBeenCalledWith(9)
    expect(sf).toHaveBeenCalledWith(9, 0)
    expect(replied).toBe('ok')
    ;(sd as any).mockClear(); (sf as any).mockClear()
  })
})
