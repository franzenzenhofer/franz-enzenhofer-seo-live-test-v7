import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as support from '@/background/rules/support'
import { runRulesOn } from '@/background/rules/runner'
import type { RuleResult } from '@/background/rules/types'

vi.mock('@/background/rules/offscreen', () => ({ runInOffscreen: vi.fn() }))
import * as off from '@/background/rules/offscreen'

const storageState: Record<string, unknown> = {}

const createChromeStub = () => {
  const get = vi.fn(async (keys?: string | string[]) => {
    if (typeof keys === 'string') return { [keys]: storageState[keys] }
    if (Array.isArray(keys)) {
      const out: Record<string, unknown> = {}
      keys.forEach((key) => { out[key] = storageState[key] })
      return out
    }
    return { ...storageState }
  })
  const set = vi.fn(async (value: Record<string, unknown>) => {
    Object.entries(value).forEach(([key, val]) => { storageState[key] = val })
  })
  const remove = vi.fn(async (key: string) => { delete storageState[key] })
  return {
    storage: {
      local: { get, set, remove },
      session: { get: vi.fn(async () => ({})), set: vi.fn(async () => ({})), remove: vi.fn(async () => ({})) },
    },
    runtime: { getURL: (p: string) => p, sendMessage: vi.fn() },
  }
}

beforeEach(() => {
  Object.keys(storageState).forEach((key) => delete storageState[key])
  // @ts-expect-error test shim
  globalThis.chrome = createChromeStub()
})

describe('runner: skip empty/early runs', () => {
  it('does not call offscreen when no dom events', async () => {
    const run = { id: 1, ev: [ { t:'nav:before', u:'https://a.example' } ] } as any
    await runRulesOn(4, run)
    expect((off.runInOffscreen as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
  })
})

describe('runner: chunked results', () => {
  it('stores each streamed result only once', async () => {
    const runInOffscreenMock = off.runInOffscreen as unknown as ReturnType<typeof vi.fn>
    runInOffscreenMock.mockImplementation(async (_tabId, _payload, _timeout, emit?: (chunk: RuleResult[]) => Promise<void>, _options?: unknown) => {
      const chunk: RuleResult[] = [
        { label: 'TEST', message: 'one', type: 'info', name: 'Rule A', ruleId: 'rule-a' },
        { label: 'TEST', message: 'two', type: 'info', name: 'Rule B', ruleId: 'rule-b' },
      ]
      await emit?.(chunk)
      return chunk
    })
    const getEnabledSpy = vi.spyOn(support, 'getEnabledRules').mockResolvedValue([
      { id: 'rule-a', name: 'Rule A', enabled: true, what: 'static', run: vi.fn() } as any,
      { id: 'rule-b', name: 'Rule B', enabled: true, what: 'static', run: vi.fn() } as any,
    ])
    const run = { id: 1, ev: [{ t: 'dom:document_idle', d: { html: '<html><body></body></html>' } }] } as any
    await runRulesOn(7, run)
    const stored = storageState['results:7'] as RuleResult[]
    expect(Array.isArray(stored)).toBe(true)
    expect(stored).toHaveLength(2)
    expect(stored.map((r) => r.message)).toEqual(['one', 'two'])
    getEnabledSpy.mockRestore()
  })
})
