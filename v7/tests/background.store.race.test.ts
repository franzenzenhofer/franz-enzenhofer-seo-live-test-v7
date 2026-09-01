import { describe, it, expect, beforeEach } from 'vitest'

import { addEvent, setDomDone, popRun, peekRun } from '@/background/pipeline/store'

// Storage mock with REAL async latency (one macrotask per op). The old
// unserialized read-modify-write stored 1 of 20 concurrent events with this
// exact mock (lost=19); the serialized store must keep all of them.
const data: Record<string, unknown> = {}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
// @ts-expect-error test shim
globalThis.chrome = {
  storage: {
    session: {
      get: async (key: string) => { await tick(); return { [key]: data[key] } },
      set: async (obj: Record<string, unknown>) => { await tick(); Object.assign(data, obj) },
      remove: async (key: string) => { await tick(); delete data[key] },
    },
  },
}

describe('store under concurrent writers', () => {
  beforeEach(() => { for (const key of Object.keys(data)) delete data[key] })

  it('keeps every concurrently pushed event', async () => {
    const N = 20
    await Promise.all(Array.from({ length: N }, (_, i) => addEvent(11, { t: `nav:${i}`, u: String(i) })))
    const run = await popRun(11)
    expect(run?.ev).toHaveLength(N)
  })

  it('does not lose events when markDomPhase races the event push', async () => {
    await Promise.all([
      addEvent(12, { t: 'dom:document_idle' }),
      setDomDone(12),
      addEvent(12, { t: 'dom:phase_results', d: { results: [{ name: 'r' }] } }),
    ])
    const run = await popRun(12)
    expect(run?.domDone).toBe(true)
    expect(run?.ev.map((e) => e.t).sort()).toEqual(['dom:document_idle', 'dom:phase_results'])
  })

  it('peekRun leaves the run in place, popRun consumes it exactly once', async () => {
    await addEvent(13, { t: 'dom:document_idle' })
    expect((await peekRun(13))?.ev).toHaveLength(1)
    expect((await peekRun(13))?.ev).toHaveLength(1)
    const [first, second] = await Promise.all([popRun(13), popRun(13)])
    const consumed = [first, second].filter((run) => run !== null)
    expect(consumed).toHaveLength(1)
  })
})
