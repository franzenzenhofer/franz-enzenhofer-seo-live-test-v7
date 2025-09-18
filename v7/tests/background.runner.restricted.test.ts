import { describe, it, expect, vi } from 'vitest'

// @ts-expect-error test shim
globalThis.chrome = { storage: { local: { get: vi.fn(async ()=> ({ })), set: vi.fn(async ()=>{}) } }, runtime: { getURL: (p: string)=> p } }

import { runRulesOn } from '@/background/rules/runner'

describe('runner: restricted schemes', () => {
  it('does not run rules for chrome:// and stores an error', async () => {
    const run = { id: 1, ev: [ { t:'nav:before', u:'chrome://extensions/' } ] } as any
    await runRulesOn(9, run)
    const setCalls = (chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>).mock.calls
    expect(setCalls.length).toBeGreaterThan(0)
    const payload = setCalls[setCalls.length-1][0]
    const arr = payload[Object.keys(payload)[0]]
    expect(Array.isArray(arr)).toBe(true)
    expect(arr[0].type).toBe('error')
    expect(String(arr[0].message)).toContain('Restricted page scheme')
  })
})

