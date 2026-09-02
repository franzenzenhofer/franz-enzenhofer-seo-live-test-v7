import { describe, it, expect, beforeEach } from 'vitest'

import { getEnabledRules } from '@/background/rules/index'
import { readPhaseExecution } from '@/content/phaseSettings'
import { registry } from '@/rules/registry'
import { isDebugRuleId, filterDebugResults } from '@/rules/debugRules'
import { STORAGE_KEYS } from '@/shared/storage-keys'

// minimal chrome.storage.local mock
const chromeAny: Record<string, unknown> = {
  storage: {
    local: {
      _d: {} as Record<string, unknown>,
      get(keys: string | string[]) {
        const list = Array.isArray(keys) ? keys : [keys]
        const d = (this as { _d: Record<string, unknown> })._d
        return Promise.resolve(Object.fromEntries(list.map((k) => [k, d[k]])))
      },
      set(o: Record<string, unknown>) { Object.assign((this as { _d: Record<string, unknown> })._d, o); return Promise.resolve() },
    },
  },
}
// @ts-expect-error assign test shim
globalThis.chrome = chromeAny

const store = () => (chrome.storage.local as unknown as { _d: Record<string, unknown> })

const debugRuleCount = registry.filter((r) => isDebugRuleId(r.id)).length

describe('debug rule gating', () => {
  beforeEach(() => { store()._d = {} })

  it('registry contains exactly two debug rules', () => {
    expect(debugRuleCount).toBe(2)
  })

  it('getEnabledRules excludes debug rules when ui:debug is off', async () => {
    const rules = await getEnabledRules()
    expect(rules.length).toBe(registry.length - debugRuleCount)
    expect(rules.some((r) => isDebugRuleId(r.id))).toBe(false)
  })

  it('getEnabledRules includes debug rules when ui:debug is on', async () => {
    store()._d[STORAGE_KEYS.UI.DEBUG] = true
    const rules = await getEnabledRules()
    expect(rules.length).toBe(registry.length)
    expect(rules.filter((r) => isDebugRuleId(r.id)).length).toBe(debugRuleCount)
  })

  it('getEnabledRules still honors rule-flags for non-debug rules', async () => {
    store()._d[STORAGE_KEYS.RULES.FLAGS] = { 'head-title': false }
    const rules = await getEnabledRules()
    const title = rules.find((r) => r.id === 'head-title')
    expect(title?.enabled).toBe(false)
  })

  it('readPhaseExecution excludes debug rules when ui:debug is off', async () => {
    const { rules } = await readPhaseExecution()
    expect(rules.some((r) => isDebugRuleId(r.id))).toBe(false)
  })

  it('readPhaseExecution includes debug rules when ui:debug is on', async () => {
    store()._d[STORAGE_KEYS.UI.DEBUG] = true
    const { rules } = await readPhaseExecution()
    expect(rules.length).toBe(registry.length)
  })

  it('offscreen run treats rules absent from the override map as not part of the run', async () => {
    const { handleRun } = await import('@/offscreen/handleRun')
    // Overrides as the background builds them with debug off: debug ids absent
    const overrides = Object.fromEntries(
      registry.filter((r) => !isDebugRuleId(r.id)).map((r) => [r.id, r.id === 'head-title']),
    )
    const run = { id: 'run-1', ev: [], domDone: true } as never
    const results = await handleRun(1, run, { runId: 'run-1' }, 'https://example.com/', overrides)
    expect(results.some((r) => r.ruleId && isDebugRuleId(r.ruleId))).toBe(false)
    expect(results.length).toBe(registry.length - debugRuleCount)
  })

  it('filterDebugResults strips stale debug results when debug is off', () => {
    const items = [
      { ruleId: 'debug:page-object', label: 'DEBUG' },
      { ruleId: null, label: 'DEBUG' },
      { ruleId: 'head-title', label: 'HEAD' },
    ]
    expect(filterDebugResults(items, false)).toEqual([{ ruleId: 'head-title', label: 'HEAD' }])
    expect(filterDebugResults(items, true)).toEqual(items)
  })
})
