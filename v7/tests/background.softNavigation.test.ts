import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Real collector, store, soft-navigation handling and recapture dispatch over an
// in-memory storage shim (pattern: background.manualRun.watchdog.test.ts). Only
// the alarms module is stubbed; the debounce timer is a fake timer.
const session: Record<string, unknown> = {}
const local: Record<string, unknown> = {}
const keys = (key: string | string[]) => (Array.isArray(key) ? key : [key])
const area = (store: Record<string, unknown>) => ({
  get: async (key: string | string[]) => Object.fromEntries(keys(key).map((k) => [k, store[k]])),
  set: async (obj: Record<string, unknown>) => { Object.assign(store, obj) },
  remove: async (key: string | string[]) => { for (const k of keys(key)) delete store[k] },
})
type Sent = { tabId: number; message: unknown; options: unknown }
const sent: Sent[] = []
let frame: { url: string; documentId: string } | null = { url: 'https://app.test/b', documentId: 'doc-1' }
// @ts-expect-error test shim
globalThis.chrome = {
  storage: { session: area(session), local: area(local) },
  tabs: { sendMessage: async (tabId: number, message: unknown, options: unknown) => { sent.push({ tabId, message, options }); return { ok: true } } },
  webNavigation: { getFrame: async () => frame },
}

const scheduleFinalize = vi.hoisted(() => vi.fn(async () => {}))
const clearFinalize = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/background/pipeline/alarms', () => ({ scheduleFinalize, clearFinalize, onAlarm: vi.fn() }))

const { pushEvent } = await import('@/background/pipeline/collector')
const { addEvent, peekRun } = await import('@/background/pipeline/store')
const { SOFT_NAV_DEBOUNCE_MS, SOFT_NAV_MAX_DEFER_MS } = await import('@/background/pipeline/softNavRecapture')
const { MANUAL_RUN_WATCHDOG_MS } = await import('@/background/pipeline/manualRun')
const { RECAPTURE_MESSAGE } = await import('@/shared/softNavigation')

const A = 'https://app.test/a'
const B = 'https://app.test/b'
const history = (u: string, documentId = 'doc-1') => ({ t: 'nav:history', u, documentId })
const loaded = async (tabId: number, url = A) => {
  await addEvent(tabId, { t: 'nav:before', u: url })
  await addEvent(tabId, { t: 'nav:commit', u: url, documentId: 'doc-1' })
}
const captured = async (tabId: number, url = A) => {
  await loaded(tabId, url)
  await addEvent(tabId, { t: 'dom:document_end', u: url, documentId: 'doc-1', d: { facts: { nodeCount: 3 } } })
  await addEvent(tabId, { t: 'dom:document_idle', u: url, documentId: 'doc-1', d: { facts: { nodeCount: 3 } } })
}
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve() }
const settle = async (ms: number) => { await vi.advanceTimersByTimeAsync(ms); await flush() }
const tabLog = (tabId: number) => ((session[`logs:${tabId}`] as string[] | undefined) || []).join('\n')

beforeEach(() => {
  for (const key of Object.keys(session)) delete session[key]
  for (const key of Object.keys(local)) delete local[key]
  local['ui:debug'] = true
  sent.length = 0
  frame = { url: B, documentId: 'doc-1' }
  scheduleFinalize.mockClear()
  clearFinalize.mockClear()
  vi.useFakeTimers()
})
afterEach(() => { vi.useRealTimers() })

describe('history update: same URL or during the load', () => {
  it('a same-URL rewrite after the last run leaves no dangling record and asks nothing', async () => {
    local['results-meta:1'] = { url: A, ranAt: 'x', runId: 'run-1', status: 'completed' }
    await pushEvent(1, history(A))
    await settle(SOFT_NAV_MAX_DEFER_MS)
    expect(await peekRun(1)).toBeNull()
    expect(sent).toEqual([])
    expect(tabLog(1)).toContain('outcome="same-url"')
  })

  it('a fragment-only difference is the same page', async () => {
    await captured(2)
    await pushEvent(2, history(`${A}#section`))
    await settle(SOFT_NAV_MAX_DEFER_MS)
    expect(sent).toEqual([])
    expect((await peekRun(2))?.ev.map((e) => e.t)).toEqual(['nav:before', 'nav:commit', 'dom:document_end', 'dom:document_idle', 'nav:history'])
  })

  it('a different URL before any DOM phase is part of the load: appended, no recapture', async () => {
    await loaded(3)
    await pushEvent(3, history(B))
    await settle(SOFT_NAV_MAX_DEFER_MS)
    const run = await peekRun(3)
    expect(run?.ev.map((e) => e.t)).toEqual(['nav:before', 'nav:commit', 'nav:history'])
    expect(run?.softNav).toBeUndefined()
    expect(sent).toEqual([])
    expect(tabLog(3)).toContain('outcome="during-load"')
  })
})

describe('history update: soft navigation with auto-run on', () => {
  it('after the last run finished (example case): a fresh record for the new URL and one recapture request to that document', async () => {
    local['results-meta:4'] = { url: A, ranAt: 'x', runId: 'run-1', status: 'completed' }
    await pushEvent(4, history(B))
    const run = await peekRun(4)
    expect(run?.ev).toEqual([history(B)])
    expect(run?.softNav?.url).toBe(B)
    expect(run?.documentId).toBe('doc-1')
    expect(sent).toEqual([])
    await settle(SOFT_NAV_DEBOUNCE_MS)
    expect(sent).toEqual([{ tabId: 4, message: { type: RECAPTURE_MESSAGE, url: B }, options: { frameId: 0, documentId: 'doc-1' } }])
    expect(tabLog(4)).toContain('recapture requested')
  })

  it('after the DOM was captured but before finalize: the previous route\'s record is replaced', async () => {
    await captured(5)
    await pushEvent(5, history(B))
    expect(clearFinalize).toHaveBeenCalledWith(5)
    const run = await peekRun(5)
    expect(run?.ev.map((e) => e.t)).toEqual(['nav:history'])
    expect(run?.softNav?.url).toBe(B)
    await settle(SOFT_NAV_DEBOUNCE_MS)
    expect(sent).toHaveLength(1)
  })

  it('rapid updates (typing into a URL-bound search box) yield exactly one request, for the last URL', async () => {
    for (let i = 1; i <= 8; i++) {
      await pushEvent(6, history(`https://app.test/search?q=${i}`))
      await settle(100)
    }
    expect(sent).toEqual([])
    frame = { url: 'https://app.test/search?q=8', documentId: 'doc-1' }
    await settle(SOFT_NAV_DEBOUNCE_MS)
    expect(sent.map((s) => (s.message as { url: string }).url)).toEqual(['https://app.test/search?q=8'])
    expect((await peekRun(6))?.softNav?.url).toBe('https://app.test/search?q=8')
  })

  it('a stream of updates that never pauses is still captured within the deferral bound', async () => {
    let elapsed = 0
    while (elapsed < SOFT_NAV_MAX_DEFER_MS + SOFT_NAV_DEBOUNCE_MS) {
      const url = `https://app.test/live?t=${elapsed}`
      frame = { url, documentId: 'doc-1' }
      await pushEvent(7, history(url))
      await settle(200)
      elapsed += 200
    }
    expect(sent.length).toBeGreaterThanOrEqual(1)
  })

  it('skips the request when the frame moved on to another URL or document meanwhile', async () => {
    await pushEvent(8, history(B))
    frame = { url: 'https://app.test/c', documentId: 'doc-1' }
    await settle(SOFT_NAV_DEBOUNCE_MS)
    expect(sent).toEqual([])
    expect(tabLog(8)).toContain('recapture skipped')
    await pushEvent(8, history('https://app.test/c'))
    frame = { url: 'https://app.test/c', documentId: 'doc-2' }
    await settle(SOFT_NAV_DEBOUNCE_MS)
    expect(sent).toEqual([])
  })

  it('a real navigation cancels the pending request', async () => {
    await pushEvent(9, history(B))
    await pushEvent(9, { t: 'nav:before', u: 'https://other.test/' })
    await settle(SOFT_NAV_MAX_DEFER_MS)
    expect(sent).toEqual([])
  })
})

describe('history update: auto-run off', () => {
  it('starts nothing and drops the superseded record; the run meta stays as it was', async () => {
    local['ui:autoRun'] = false
    local['results-meta:10'] = { url: A, ranAt: 'x', runId: 'run-1', status: 'completed' }
    await captured(10)
    await pushEvent(10, history(B))
    await settle(SOFT_NAV_MAX_DEFER_MS)
    expect(await peekRun(10)).toBeNull()
    expect(sent).toEqual([])
    expect(local['results-meta:10']).toEqual({ url: A, ranAt: 'x', runId: 'run-1', status: 'completed' })
    expect(tabLog(10)).toContain('audited=false')
  })

  it('a Run test still in flight carries over: the new route is captured and the watchdog re-armed', async () => {
    local['ui:autoRun'] = false
    await captured(11)
    const run = await peekRun(11)
    await chrome.storage.session.set({ 'run:11': { ...run, manual: true } })
    await pushEvent(11, history(B))
    expect((await peekRun(11))?.manual).toBe(true)
    expect(scheduleFinalize).toHaveBeenCalledWith(11, MANUAL_RUN_WATCHDOG_MS)
    await settle(SOFT_NAV_DEBOUNCE_MS)
    expect(sent).toHaveLength(1)
  })
})
