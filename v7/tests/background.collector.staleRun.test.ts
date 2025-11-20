import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal chrome shim for tested paths
// @ts-expect-error test shim
globalThis.chrome = {
  alarms: { onAlarm: { addListener: vi.fn() }, clear: vi.fn(), create: vi.fn() },
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
})
