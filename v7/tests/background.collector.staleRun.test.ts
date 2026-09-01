import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal chrome shim for tested paths
// @ts-expect-error test shim
globalThis.chrome = {
  alarms: { onAlarm: { addListener: vi.fn() }, clear: vi.fn(), create: vi.fn() },
  tabs: { get: vi.fn(async () => ({ active: true })) },
  storage: {
    local: { get: vi.fn(async () => ({})), remove: vi.fn(async () => {}) },
    session: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}), remove: vi.fn(async () => {}) },
  },
}

let storedRun: any = null

const runRulesOn = vi.hoisted(() => vi.fn())
const alarmHandlerHolder = vi.hoisted(() => ({ handler: null as ((tabId: number) => Promise<void> | void) | null }))

vi.mock('@/background/rules/runner', () => ({ runRulesOn }))
vi.mock('@/shared/logger', () => ({ Logger: { logDirect: vi.fn(), logDirectSend: vi.fn(), setContext: vi.fn() } }))
vi.mock('@/shared/logs', () => ({ log: vi.fn(), logSystem: vi.fn(), isValidTabId: () => true }))

vi.mock('@/background/pipeline/store', () => ({
  addEvent: vi.fn().mockResolvedValue(undefined),
  setDomDone: vi.fn(),
  resetRun: vi.fn().mockResolvedValue(undefined),
  peekRun: vi.fn(async () => storedRun),
  popRun: vi.fn(async () => {
    const r = storedRun
    storedRun = null
    return r
  }),
}))

vi.mock('@/background/pipeline/alarms', () => ({
  scheduleFinalize: vi.fn(),
  clearFinalize: vi.fn(),
  onAlarm: (cb: (tabId: number) => void) => { alarmHandlerHolder.handler = cb },
}))

// Import registers onAlarm handler using mocks above
import '@/background/pipeline/collector'

const setRun = (run: any) => { storedRun = run }
const invokeAlarm = async (tabId: number) => { await alarmHandlerHolder.handler?.(tabId) }

describe('collector alarm guard', () => {
  beforeEach(() => {
    runRulesOn.mockReset()
    ;(chrome.tabs.get as unknown as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue({ active: true })
    setRun(null)
  })

  it('skips execution when nav happens after dom capture', async () => {
    setRun({ id: 1, ev: [{ t: 'dom:document_idle' }, { t: 'nav:before', u: 'https://later.example' }] })
    await invokeAlarm(3)
    expect(runRulesOn).not.toHaveBeenCalled()
  })

  it('executes when dom is latest event', async () => {
    setRun({ id: 2, ev: [{ t: 'nav:before', u: 'https://first.example' }, { t: 'dom:document_idle', d: { html: '<html></html>' } }] })
    await invokeAlarm(4)
    expect(runRulesOn).toHaveBeenCalledTimes(1)
  })

  it('skips automatic execution for an inactive tab', async () => {
    ;(chrome.tabs.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ active: false })
    setRun({ id: 3, ev: [{ t: 'dom:document_idle' }] })
    await invokeAlarm(5)
    expect(runRulesOn).not.toHaveBeenCalled()
  })

  it('executes only the active tab across many pending tab alarms', async () => {
    const tabsGet = chrome.tabs.get as unknown as ReturnType<typeof vi.fn>
    for (let tabId = 10; tabId < 35; tabId++) {
      tabsGet.mockResolvedValueOnce({ active: false })
      setRun({ id: tabId, ev: [{ t: 'dom:document_idle' }] })
      await invokeAlarm(tabId)
    }
    tabsGet.mockResolvedValueOnce({ active: true })
    setRun({ id: 35, ev: [{ t: 'dom:document_idle' }] })
    await invokeAlarm(35)

    expect(runRulesOn).toHaveBeenCalledTimes(1)
    expect(runRulesOn).toHaveBeenCalledWith(35, expect.objectContaining({ id: 35 }))
  })
})
