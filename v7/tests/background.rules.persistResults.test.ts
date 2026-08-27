import { beforeEach, describe, expect, it, vi } from 'vitest'

import { persistResults, KEEP_LAST_RUNS, type PersistableResult } from '@/background/rules/persistResults'

const storageState: Record<string, unknown> = {}

const createChromeStub = () => {
  const get = vi.fn(async (key?: string) => {
    if (typeof key === 'string') return { [key]: storageState[key] }
    return { ...storageState }
  })
  const set = vi.fn(async (value: Record<string, unknown>) => {
    Object.entries(value).forEach(([k, v]) => { storageState[k] = v })
  })
  const remove = vi.fn(async (key: string) => { delete storageState[key] })
  return { storage: { local: { get, set, remove } }, runtime: { sendMessage: vi.fn() } }
}

const makeRun = (runId: string, count: number, padding = 0): PersistableResult[] =>
  Array.from({ length: count }, (_, i) => ({ name: `r${i}`, type: 'info', ruleId: `rule:${i}`, runIdentifier: runId, message: 'x'.repeat(padding) }))

describe('persistResults retention', () => {
  beforeEach(() => {
    Object.keys(storageState).forEach((k) => delete storageState[k])
    // @ts-expect-error test shim
    globalThis.chrome = createChromeStub()
  })

  it(`keeps only the last ${KEEP_LAST_RUNS} runs by runIdentifier`, async () => {
    const key = 'results:42'
    const prev: PersistableResult[] = [
      ...makeRun('run-A', 2),
      ...makeRun('run-B', 2),
      ...makeRun('run-C', 2),
      ...makeRun('run-D', 2),
    ]
    await persistResults(42, key, prev, makeRun('run-E', 2))
    const stored = storageState[key] as PersistableResult[]
    const seenRuns = new Set(stored.map((r) => r.runIdentifier))
    expect(seenRuns.has('run-A')).toBe(false)
    expect(seenRuns.has('run-B')).toBe(false)
    expect(seenRuns.size).toBeLessThanOrEqual(KEEP_LAST_RUNS)
    expect(seenRuns.has('run-E')).toBe(true)
  })

  it('evicts oldest run when soft byte cap is breached', async () => {
    const key = 'results:7'
    // Each run is ~1.2 MB; 3 such runs exceed the 2 MB soft cap.
    const prev: PersistableResult[] = [
      ...makeRun('run-old', 1, 1_200_000),
      ...makeRun('run-mid', 1, 1_200_000),
    ]
    await persistResults(7, key, prev, makeRun('run-new', 1, 1_200_000))
    const stored = storageState[key] as PersistableResult[]
    const seenRuns = new Set(stored.map((r) => r.runIdentifier))
    expect(seenRuns.has('run-old')).toBe(false)
    expect(seenRuns.has('run-new')).toBe(true)
  })

  it('keeps results without a runIdentifier (legacy rows)', async () => {
    const key = 'results:9'
    const prev: PersistableResult[] = [
      { name: 'legacy', type: 'info' },
      ...makeRun('run-A', 1),
    ]
    await persistResults(9, key, prev, makeRun('run-B', 1))
    const stored = storageState[key] as PersistableResult[]
    expect(stored.some((r) => r.name === 'legacy')).toBe(true)
  })

  it('retries quota failures without details while preserving every core result', async () => {
    const set = chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>
    set.mockRejectedValueOnce(new Error('QUOTA_BYTES quota exceeded'))
    const rows = makeRun('run-quota', 3).map((row) => ({ ...row, details: { sourceHtml: 'x'.repeat(10_000) } }))

    await persistResults(11, 'results:11', [], rows)

    const stored = storageState['results:11'] as PersistableResult[]
    expect(stored).toHaveLength(3)
    expect(stored.every((row) => !('details' in row))).toBe(true)
  })
})
