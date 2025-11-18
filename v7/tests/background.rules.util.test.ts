import { beforeEach, describe, expect, it, vi } from 'vitest'

import { persistResults } from '@/background/rules/util'

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
  return { storage: { local: { get, set, remove } } }
}

describe('persistResults', () => {
  beforeEach(() => {
    Object.keys(storageState).forEach((key) => delete storageState[key])
    // @ts-expect-error test shim
    globalThis.chrome = createChromeStub()
  })

  it('drops pending rows when final result shares ruleId', async () => {
    const key = 'results:9'
    const pending = [{ name: 'HTML lang attribute', type: 'pending', ruleId: 'dom:html-lang' }]
    await persistResults(9, key, pending, [{ name: 'custom name', type: 'info', ruleId: 'dom:html-lang' }])
    const stored = storageState[key] as Array<{ type: string }>
    expect(stored).toHaveLength(1)
    expect(stored[0].type).toBe('info')
  })
})
