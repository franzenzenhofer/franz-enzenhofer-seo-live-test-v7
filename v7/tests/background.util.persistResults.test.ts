import { describe, it, expect, beforeEach } from 'vitest'

import { persistResults } from '@/background/rules/util'
import { setActiveRunId, clearActiveRunId } from '@/shared/activeRun'

// Mock chrome.storage
const chromeAny: Record<string, unknown> = {
  storage: {
    session: {
      _d: {} as Record<string, unknown>,
      get(k: string) {
        return Promise.resolve({ [k]: (this as { _d: Record<string, unknown> })._d[k] })
      },
      set(o: Record<string, unknown>) {
        Object.assign((this as { _d: Record<string, unknown> })._d, o)
        return Promise.resolve()
      },
      remove(k: string) {
        delete (this as { _d: Record<string, unknown> })._d[k]
        return Promise.resolve()
      },
    },
    local: {
      _d: {} as Record<string, unknown>,
      get(k: string) {
        return Promise.resolve({ [k]: (this as { _d: Record<string, unknown> })._d[k] })
      },
      set(o: Record<string, unknown>) {
        Object.assign((this as { _d: Record<string, unknown> })._d, o)
        return Promise.resolve()
      },
      remove(k: string) {
        delete (this as { _d: Record<string, unknown> })._d[k]
        return Promise.resolve()
      },
    },
  },
}
// @ts-expect-error test shim
globalThis.chrome = chromeAny

describe('persistResults with run ID validation', () => {
  const tabId = 123
  const key = 'results:123'

  beforeEach(() => {
    // @ts-expect-error test shim
    chrome.storage.session._d = {}
    // @ts-expect-error test shim
    chrome.storage.local._d = {}
  })

  it('persists results when no run ID provided (backward compat)', async () => {
    const results = [{ name: 'test:rule', message: 'Test message', type: 'info' }]

    const count = await persistResults(tabId, key, undefined, results)

    expect(count).toBe(1)
    // @ts-expect-error test shim
    expect(chrome.storage.local._d[key]).toEqual(results)
  })

  it('persists results when run ID matches active run', async () => {
    const runId = 'run-123-active'
    await setActiveRunId(tabId, runId)

    const results = [{ name: 'test:rule', message: 'Test', type: 'info' }]
    const count = await persistResults(tabId, key, undefined, results, runId)

    expect(count).toBe(1)
    // @ts-expect-error test shim
    expect(chrome.storage.local._d[key]).toEqual(results)
  })

  it('skips persisting when run ID does not match active run', async () => {
    const oldRunId = 'run-123-old'
    const newRunId = 'run-123-new'

    await setActiveRunId(tabId, newRunId)

    const results = [{ name: 'test:rule', message: 'Old run result', type: 'info' }]
    const count = await persistResults(tabId, key, undefined, results, oldRunId)

    expect(count).toBe(0)
    // @ts-expect-error test shim
    expect(chrome.storage.local._d[key]).toBeUndefined()
  })

  it('skips persisting when no active run exists', async () => {
    const runId = 'run-123-missing'

    const results = [{ name: 'test:rule', message: 'Result', type: 'info' }]
    const count = await persistResults(tabId, key, undefined, results, runId)

    expect(count).toBe(0)
    // @ts-expect-error test shim
    expect(chrome.storage.local._d[key]).toBeUndefined()
  })

  it('skips persisting when active run is cancelled', async () => {
    const runId = 'run-123-cancelled'

    await setActiveRunId(tabId, runId)
    await clearActiveRunId(tabId)

    const results = [{ name: 'test:rule', message: 'Cancelled run', type: 'info' }]
    const count = await persistResults(tabId, key, undefined, results, runId)

    expect(count).toBe(0)
    // @ts-expect-error test shim
    expect(chrome.storage.local._d[key]).toBeUndefined()
  })

  it('merges results correctly when run is still active', async () => {
    const runId = 'run-123-merge'
    await setActiveRunId(tabId, runId)

    const prev = [{ name: 'test:first', message: 'First', type: 'info' }]
    const add = [{ name: 'test:second', message: 'Second', type: 'info' }]

    const count = await persistResults(tabId, key, prev, add, runId)

    expect(count).toBe(2)
    // @ts-expect-error test shim
    const stored = chrome.storage.local._d[key]
    expect(stored).toHaveLength(2)
  })

  it('filters out pending results during merge', async () => {
    const runId = 'run-123-pending'
    await setActiveRunId(tabId, runId)

    const prev = [
      { name: 'test:rule', message: 'Real', type: 'info' },
      { name: 'test:pending', message: 'Loading...', type: 'pending' },
    ]
    const add = [{ name: 'test:new', message: 'New result', type: 'info' }]

    const count = await persistResults(tabId, key, prev, add, runId)

    expect(count).toBe(2)
    // @ts-expect-error test shim
    const stored = chrome.storage.local._d[key] as Array<{ type?: string }>
    expect(stored.every((r) => r.type !== 'pending')).toBe(true)
  })
})
