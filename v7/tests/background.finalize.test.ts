import { describe, it, expect, vi, beforeEach } from 'vitest'

// @ts-expect-error test shim
globalThis.chrome = { tabs: { get: vi.fn(async () => ({ active: true })) } }

let storedRun: unknown = null

const runRulesOn = vi.hoisted(() => vi.fn())
const scheduleFinalize = vi.hoisted(() => vi.fn())
const resetRun = vi.hoisted(() => vi.fn(async () => { storedRun = null }))

vi.mock('@/background/rules/runner', () => ({ runRulesOn }))
vi.mock('@/shared/logger', () => ({ Logger: { logDirect: vi.fn(), logDirectSend: vi.fn(), setContext: vi.fn() } }))
vi.mock('@/background/pipeline/alarms', () => ({ scheduleFinalize, clearFinalize: vi.fn(), onAlarm: vi.fn() }))
vi.mock('@/background/pipeline/store', () => ({
  peekRun: vi.fn(async () => storedRun),
  popRun: vi.fn(async () => { const r = storedRun; storedRun = null; return r }),
  resetRun,
}))

import { finalizeTab, resumePendingRun } from '@/background/pipeline/finalize'

const tabsGet = () => chrome.tabs.get as unknown as ReturnType<typeof vi.fn>

describe('finalizeTab', () => {
  beforeEach(() => {
    runRulesOn.mockReset()
    scheduleFinalize.mockReset()
    resetRun.mockClear()
    tabsGet().mockReset().mockResolvedValue({ active: true })
    storedRun = null
  })

  it('keeps the run (including phase results) when the tab is inactive', async () => {
    tabsGet().mockResolvedValue({ active: false })
    storedRun = { id: 1, ev: [{ t: 'dom:document_idle' }, { t: 'dom:phase_results', d: { results: [{}] } }], domDone: true }
    await finalizeTab(5)
    expect(runRulesOn).not.toHaveBeenCalled()
    expect(storedRun).not.toBeNull()
  })

  it('resumes a kept run when the tab activates', async () => {
    storedRun = { id: 2, ev: [{ t: 'dom:document_idle' }], domDone: true }
    expect(await resumePendingRun(5)).toBe(true)
    expect(scheduleFinalize).toHaveBeenCalledWith(5, 200)
  })

  it('does not resume when there is no finished run', async () => {
    storedRun = { id: 3, ev: [{ t: 'nav:before' }] }
    expect(await resumePendingRun(5)).toBe(false)
    expect(scheduleFinalize).not.toHaveBeenCalled()
  })

  it('discards a stale run after a later navigation', async () => {
    storedRun = { id: 4, ev: [{ t: 'dom:document_idle' }, { t: 'nav:before', u: 'https://next.example' }] }
    await finalizeTab(6)
    expect(runRulesOn).not.toHaveBeenCalled()
    expect(resetRun).toHaveBeenCalledWith(6)
  })

  it('never executes a run that has no dom phase (would abort the in-flight session)', async () => {
    storedRun = { id: 6, ev: [{ t: 'req:mainHeaders', u: 'https://next.example' }] }
    await finalizeTab(8)
    expect(runRulesOn).not.toHaveBeenCalled()
    expect(storedRun).not.toBeNull()
  })

  it('executes an active-tab run exactly once even when fired twice', async () => {
    storedRun = { id: 5, ev: [{ t: 'dom:document_idle' }], domDone: true }
    await Promise.all([finalizeTab(7), finalizeTab(7)])
    expect(runRulesOn).toHaveBeenCalledTimes(1)
  })
})
