import { describe, it, expect, vi } from 'vitest'

// Provide chrome shim and mock store/alarm modules before import
// @ts-expect-error test shim
globalThis.chrome = { storage: { local: { get: vi.fn(async ()=> ({ })), remove: vi.fn(async (_k)=>{} ) } } }

vi.mock('@/background/pipeline/store', () => ({ addEvent: vi.fn().mockResolvedValue(undefined), popRun: vi.fn(), setDomDone: vi.fn() }))
vi.mock('@/background/pipeline/alarms', () => ({ scheduleFinalize: vi.fn().mockResolvedValue(undefined), onAlarm: (_cb: (tabId: number)=>void)=>{} }))

import { pushEvent } from '@/background/pipeline/collector'

describe('collector: autoClear on nav:before', () => {
  it('removes results by default', async () => {
    const rm = (chrome.storage.local.remove as unknown as ReturnType<typeof vi.fn>)
    await pushEvent(5, { t: 'nav:before', u: 'https://a.example' } as any)
    expect(rm).toHaveBeenCalledWith('results:5')
  })
  it('respects ui:autoClear=false', async () => {
    ;(chrome.storage.local.get as any).mockResolvedValueOnce({ 'ui:autoClear': false })
    const rm = (chrome.storage.local.remove as unknown as ReturnType<typeof vi.fn>)
    rm.mockClear()
    await pushEvent(6, { t: 'nav:before', u: 'https://b.example' } as any)
    expect(rm).not.toHaveBeenCalled()
  })
})

