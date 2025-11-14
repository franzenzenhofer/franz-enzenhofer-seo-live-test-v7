import { describe, it, expect, vi } from 'vitest'

// Minimal chrome shim must be installed and modules mocked before importing the listener
// @ts-expect-error test shim
globalThis.chrome = {
  alarms: { onAlarm: { addListener: () => {} }, create: async () => {} },
  storage: {
    local: { get: async () => ({}), remove: async () => {} },
    session: { get: async () => ({}), set: async () => {}, remove: async () => {} },
  },
  tabs: { get: async () => ({ url: 'https://example.test' }) },
}

vi.mock('@/background/pipeline/store', () => ({ setDomDone: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/background/pipeline/alarms', () => ({
  scheduleFinalize: vi.fn().mockResolvedValue(undefined),
  onAlarm: (_cb: (tabId: number) => void) => {},
}))
vi.mock('@/background/pipeline/collector', () => ({
  pushEvent: vi.fn().mockResolvedValue(undefined),
  markDomPhase: vi.fn().mockResolvedValue(undefined),
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
    await vi.waitFor(() => expect(sd).toHaveBeenCalledWith(9))
    await vi.waitFor(() => expect(sf).toHaveBeenCalledWith(9, 100))
    expect(replied).toBe('ok')
    ;(sd as any).mockClear(); (sf as any).mockClear()
  })
})
