import { describe, it, expect, vi } from 'vitest'

// @ts-expect-error test shim
globalThis.chrome = { storage: { local: { get: vi.fn(async ()=> ({ })), set: vi.fn(async ()=>{}) }, session: { get: vi.fn(async()=>({})), set: vi.fn(async()=>({})) } }, runtime: { getURL: (p: string)=> p } }

vi.mock('@/background/rules/offscreen', () => ({ runInOffscreen: vi.fn() }))
import * as off from '@/background/rules/offscreen'
import { runRulesOn } from '@/background/rules/runner'

describe('runner: skip empty/early runs', () => {
  it('does not call offscreen when no dom events', async () => {
    const run = { id: 1, ev: [ { t:'nav:before', u:'https://a.example' } ] } as any
    await runRulesOn(4, run)
    expect((off.runInOffscreen as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
  })
})
