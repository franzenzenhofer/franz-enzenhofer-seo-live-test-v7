import { describe, it, expect, beforeEach } from 'vitest'

import {
  generateRunId,
  setActiveRunId,
  getActiveRunId,
  clearActiveRunId,
  isActiveRun,
  cancelActiveRun,
} from '@/shared/activeRun'

// Mock chrome.storage.session
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
  },
}
// @ts-expect-error test shim
globalThis.chrome = chromeAny

describe('activeRun', () => {
  beforeEach(() => {
    // @ts-expect-error test shim
    chrome.storage.session._d = {}
  })

  it('generates unique run IDs', () => {
    const id1 = generateRunId()
    const id2 = generateRunId()
    expect(id1).toMatch(/^run-\d+-[a-z0-9]+$/)
    expect(id2).toMatch(/^run-\d+-[a-z0-9]+$/)
    expect(id1).not.toBe(id2)
  })

  it('sets and gets active run ID', async () => {
    const tabId = 123
    const runId = 'run-123-abc'

    await setActiveRunId(tabId, runId)
    const retrieved = await getActiveRunId(tabId)

    expect(retrieved).toBe(runId)
  })

  it('returns null when no active run', async () => {
    const tabId = 456
    const retrieved = await getActiveRunId(tabId)
    expect(retrieved).toBeNull()
  })

  it('clears active run ID', async () => {
    const tabId = 789
    const runId = 'run-789-xyz'

    await setActiveRunId(tabId, runId)
    expect(await getActiveRunId(tabId)).toBe(runId)

    await clearActiveRunId(tabId)
    expect(await getActiveRunId(tabId)).toBeNull()
  })

  it('isActiveRun returns true for current run', async () => {
    const tabId = 111
    const runId = 'run-111-current'

    await setActiveRunId(tabId, runId)
    const active = await isActiveRun(tabId, runId)

    expect(active).toBe(true)
  })

  it('isActiveRun returns false for old run', async () => {
    const tabId = 222
    const oldRunId = 'run-222-old'
    const newRunId = 'run-222-new'

    await setActiveRunId(tabId, oldRunId)
    await setActiveRunId(tabId, newRunId)

    const stillActive = await isActiveRun(tabId, oldRunId)
    expect(stillActive).toBe(false)
  })

  it('isActiveRun returns false when no active run', async () => {
    const tabId = 333
    const runId = 'run-333-missing'

    const active = await isActiveRun(tabId, runId)
    expect(active).toBe(false)
  })

  it('cancelActiveRun clears the active run', async () => {
    const tabId = 444
    const runId = 'run-444-cancel'

    await setActiveRunId(tabId, runId)
    await cancelActiveRun(tabId)

    const retrieved = await getActiveRunId(tabId)
    expect(retrieved).toBeNull()
  })

  it('handles multiple tabs independently', async () => {
    const tab1 = 101
    const tab2 = 102
    const runId1 = 'run-101-a'
    const runId2 = 'run-102-b'

    await setActiveRunId(tab1, runId1)
    await setActiveRunId(tab2, runId2)

    expect(await getActiveRunId(tab1)).toBe(runId1)
    expect(await getActiveRunId(tab2)).toBe(runId2)

    await clearActiveRunId(tab1)

    expect(await getActiveRunId(tab1)).toBeNull()
    expect(await getActiveRunId(tab2)).toBe(runId2)
  })
})
