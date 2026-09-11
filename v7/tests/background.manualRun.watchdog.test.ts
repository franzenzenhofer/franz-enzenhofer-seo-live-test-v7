import { beforeEach, describe, expect, it, vi } from 'vitest'

// Real store + real manualRun over an in-memory storage shim (pattern:
// background.lifecycle.race.test.ts). Alarms and the runner are stubbed so the
// watchdog's arming and the terminal state can be asserted directly.
const session: Record<string, unknown> = {}
const local: Record<string, unknown> = {}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const keys = (key: string | string[]) => (Array.isArray(key) ? key : [key])
const area = (store: Record<string, unknown>) => ({
  get: async (key: string | string[]) => { await tick(); return Object.fromEntries(keys(key).map((k) => [k, store[k]])) },
  set: async (obj: Record<string, unknown>) => { await tick(); Object.assign(store, obj) },
  remove: async (key: string | string[]) => { await tick(); for (const k of keys(key)) delete store[k] },
})
// @ts-expect-error test shim
globalThis.chrome = { storage: { session: area(session), local: area(local) }, tabs: { get: async () => ({ active: true }) } }

const runRulesOn = vi.hoisted(() => vi.fn())
const scheduleFinalize = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/background/rules/runner', () => ({ runRulesOn }))
vi.mock('@/background/pipeline/alarms', () => ({ scheduleFinalize, clearFinalize: vi.fn(), onAlarm: vi.fn() }))
vi.mock('@/shared/runHistory', () => ({ appendRunHistory: vi.fn(async () => {}) }))

const { bindManualRun, MANUAL_RUN_WATCHDOG_MS, NO_PAGE_REPORT_RULE } = await import('@/background/pipeline/manualRun')
const { addEvent, peekRun } = await import('@/background/pipeline/store')
const { finalizeTab } = await import('@/background/pipeline/finalize')
const { manualAuditKey } = await import('@/shared/auditIntent')

const commit = async (tabId: number, documentId: string) => {
  await addEvent(tabId, { t: 'nav:before', u: 'https://example.test/' })
  await addEvent(tabId, { t: 'nav:commit', u: 'https://example.test/', documentId })
  return bindManualRun(tabId, documentId)
}

beforeEach(() => {
  for (const key of Object.keys(session)) delete session[key]
  for (const key of Object.keys(local)) delete local[key]
  runRulesOn.mockReset()
  scheduleFinalize.mockClear()
})

describe('manual run watchdog', () => {
  it('arms the watchdog when the intent is bound at nav:commit', async () => {
    session[manualAuditKey(51)] = { requestedAt: Date.now() }
    expect(await commit(51, 'doc-1')).toBe(true)
    expect(scheduleFinalize).toHaveBeenCalledWith(51, MANUAL_RUN_WATCHDOG_MS)
    expect((await peekRun(51))?.manual).toBe(true)
  })

  it('does not arm anything for a normal navigation', async () => {
    expect(await commit(52, 'doc-1')).toBe(false)
    expect(scheduleFinalize).not.toHaveBeenCalled()
    expect((await peekRun(52))?.manual).toBeUndefined()
  })

  it('settles a manual run without any phase into a visible skipped state and drops the run record', async () => {
    session[manualAuditKey(53)] = { requestedAt: Date.now() }
    await commit(53, 'doc-1')
    await finalizeTab(53)
    expect(runRulesOn).not.toHaveBeenCalled()
    expect(await peekRun(53)).toBeNull()
    const results = local['results:53'] as Array<{ ruleId: string; type: string; message: string }>
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ ruleId: NO_PAGE_REPORT_RULE.ruleId, type: 'info' })
    expect(results[0]!.message).toMatch(/^Not tested: the page did not report back within 15 s/)
    expect(local['results-meta:53']).toMatchObject({ status: 'skipped', url: 'https://example.test/' })
  })

  it('keeps an automatic run without a phase exactly as before (skip-kept)', async () => {
    await commit(54, 'doc-1')
    await finalizeTab(54)
    expect(runRulesOn).not.toHaveBeenCalled()
    expect(await peekRun(54)).not.toBeNull()
    expect(local['results:54']).toBeUndefined()
  })

  it('lets a manual run whose phases landed execute normally', async () => {
    session[manualAuditKey(55)] = { requestedAt: Date.now() }
    await commit(55, 'doc-1')
    await addEvent(55, { t: 'dom:document_end', documentId: 'doc-1', d: { facts: { nodeCount: 1 } } })
    await addEvent(55, { t: 'dom:document_idle', documentId: 'doc-1', d: { facts: { nodeCount: 1 } } })
    await finalizeTab(55)
    expect(runRulesOn).toHaveBeenCalledTimes(1)
    expect(local['results:55']).toBeUndefined()
  })
})
