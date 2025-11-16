import { describe, it, expect, vi, beforeEach } from 'vitest'

const storageState: Record<string, unknown> = {}

// @ts-expect-error test shim
globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn(async (k?: string) => {
        if (typeof k === 'string') return { [k]: storageState[k] }
        return { ...storageState }
      }),
      set: vi.fn(async (o: Record<string, unknown>) => {
        Object.assign(storageState, o)
      }),
    },
    session: {
      get: vi.fn(async (k?: string) => {
        if (typeof k === 'string') return { [k]: storageState[k] }
        return { ...storageState }
      }),
      set: vi.fn(async (o: Record<string, unknown>) => {
        Object.assign(storageState, o)
      }),
      remove: vi.fn(async (k: string) => {
        delete storageState[k]
      }),
    },
  },
  runtime: { getURL: (p: string) => p },
}

import { runRulesOn } from '@/background/rules/runner'
import { setActiveRunId } from '@/shared/activeRun'

describe('runner: restricted schemes', () => {
  beforeEach(() => {
    Object.keys(storageState).forEach((key) => delete storageState[key])
  })

  it('does not run rules for chrome:// and stores an error', async () => {
    const tabId = 9
    await setActiveRunId(tabId, 'run-test-123')

    const run = { id: 1, ev: [{ t: 'nav:before', u: 'chrome://extensions/' }] } as any
    await runRulesOn(tabId, run)
    const setCalls = (chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>).mock.calls
    expect(setCalls.length).toBeGreaterThan(0)
    const payload = setCalls[setCalls.length - 1]![0]
    const arr = payload[Object.keys(payload)[0]!]
    expect(Array.isArray(arr)).toBe(true)
    expect(arr[0].type).toBe('error')
    expect(String(arr[0].message)).toContain('Restricted page scheme')
  })
})

