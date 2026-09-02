import { describe, it, expect, beforeEach, vi } from 'vitest'

import { prepareResultsStorage } from '@/background/rules/seedResults'
import type { Rule } from '@/core/types'

const store: Record<string, unknown> = {}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (k: string) => ({ [k]: store[k] }),
        set: async (o: Record<string, unknown>) => { Object.assign(store, o) },
      },
      session: { get: async () => ({}), set: async () => {} },
    },
  })
})

const rule = (id: string): Rule => ({ id, name: id, enabled: true, what: 'static', meta: { provenance: 'franz', references: [] }, run: async () => ({}) } as unknown as Rule)
const rules = ['a:1', 'a:2', 'b:1', 'b:2'].map(rule)
const idx = { 'a:1': 1, 'a:2': 2, 'b:1': 3, 'b:2': 4 }

const stored = () => (store['results:1'] || []) as Array<{ ruleId?: string; type?: string }>

describe('prepareResultsStorage', () => {
  it('marks every rule pending when nothing has run yet', async () => {
    await prepareResultsStorage(1, 'results:1', rules, 'run-1', idx)
    expect(stored()).toHaveLength(4)
    expect(stored().every((r) => r.type === 'pending')).toBe(true)
  })

  it('seeds already-answered rules with their result instead of a placeholder', async () => {
    // Static/idle rules finish in the content script long before the offscreen
    // batch; they must not be parked behind it showing "Running...".
    const settled = [
      { ruleId: 'a:1', name: 'a:1', type: 'ok', message: 'done' },
      { ruleId: 'a:2', name: 'a:2', type: 'warn', message: 'done' },
    ]
    await prepareResultsStorage(1, 'results:1', rules, 'run-1', idx, settled as never)

    expect(stored()).toHaveLength(4)
    const byId = new Map(stored().map((r) => [r.ruleId, r.type]))
    expect(byId.get('a:1')).toBe('ok')
    expect(byId.get('a:2')).toBe('warn')
    expect(byId.get('b:1')).toBe('pending')
    expect(byId.get('b:2')).toBe('pending')
  })

  it('never emits a rule twice', async () => {
    const settled = [{ ruleId: 'b:1', name: 'b:1', type: 'info', message: 'x' }]
    await prepareResultsStorage(1, 'results:1', rules, 'run-1', idx, settled as never)
    const ids = stored().map((r) => r.ruleId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
