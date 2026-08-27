import { beforeEach, describe, expect, it, vi } from 'vitest'

const state: Record<string, unknown> = {}
const remove = vi.fn(async (keys: string | string[]) => {
  for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key]
})

vi.mock('@/background/pipeline/alarms', () => ({ clearFinalize: vi.fn() }))
vi.mock('@/background/pipeline/store', () => ({ resetRun: vi.fn() }))
vi.mock('@/background/rules/sessions', () => ({ abortSession: vi.fn() }))
vi.mock('@/background/history/listeners', () => ({ clearLedger: vi.fn() }))
vi.mock('@/shared/logStore', () => ({ clearLogsFromSession: vi.fn() }))

import { cleanupClosedTab, CLOSED_TAB_LIMIT } from '@/background/tabCleanup'

describe('tab cleanup', () => {
  beforeEach(() => {
    Object.keys(state).forEach((key) => delete state[key])
    remove.mockClear()
    // @ts-expect-error test shim
    globalThis.chrome = { storage: { local: {
      get: vi.fn(async (key: string) => ({ [key]: state[key] })),
      set: vi.fn(async (value: Record<string, unknown>) => { Object.assign(state, value) }),
      remove,
    } } }
  })

  it('keeps a bounded LRU of closed-tab result keys', async () => {
    for (let tabId = 1; tabId <= CLOSED_TAB_LIMIT + 2; tabId++) await cleanupClosedTab(tabId)
    expect(state['results:closed-tabs']).toEqual(Array.from({ length: CLOSED_TAB_LIMIT }, (_, index) => index + 3))
    expect(remove).toHaveBeenCalledWith(['results:2', 'results-meta:2'])
  })

  it('removes stale pending rows while preserving terminal findings', async () => {
    state['results:9'] = [{ type: 'pending' }, { type: 'warn', message: 'keep' }]
    await cleanupClosedTab(9)
    expect(state['results:9']).toEqual([{ type: 'warn', message: 'keep' }])
  })
})
