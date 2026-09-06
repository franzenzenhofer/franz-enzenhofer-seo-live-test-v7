import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    local: { get: async () => ({}), set: async () => {}, remove: async () => {} },
  },
}

const { addEvent, setDomDone, popRun } = await import('@/background/pipeline/store')
const { startSession, finishSession, isSessionActive, withActiveSession, abortSession } =
  await import('@/background/rules/sessions')

beforeEach(async () => {
  for (const key of Object.keys(data)) delete data[key]
  await abortSession(21).catch(() => null)
  await abortSession(22).catch(() => null)
})

describe('run generations', () => {
  it('an older run may not supersede - or abort - the newer run that overtook it', async () => {
    const newer = await startSession(21, 'run-new', 2000)
    expect(newer).not.toBeNull()
    // Run A resolved its page URL late and only now tries to claim the tab.
    const older = await startSession(21, 'run-old', 1000)
    expect(older).toBeNull()
    expect(newer!.aborted).toBe(false)
    expect(await isSessionActive(21, 'run-new')).toBe(true)
  })

  it('a superseded run can neither finish nor write results for the current one', async () => {
    await startSession(22, 'run-a', 1000)
    await startSession(22, 'run-b', 2000)
    expect(await finishSession(22, 'completed', 'run-a')).toBeNull()
    const wrote = vi.fn()
    await withActiveSession(22, 'run-a', async () => { wrote() })
    expect(wrote).not.toHaveBeenCalled()
    expect(await isSessionActive(22, 'run-b')).toBe(true)
    await withActiveSession(22, 'run-b', async () => { wrote() })
    expect(wrote).toHaveBeenCalledTimes(1)
  })
})

describe('dom phase completion identity', () => {
  it('ignores an idle phase belonging to a superseded document', async () => {
    await addEvent(31, { t: 'dom:document_end', documentId: 'doc-2' })
    expect(await setDomDone(31, 'doc-1')).toBe('stale')
    expect((await popRun(31))?.domDone).toBeUndefined()
  })

  it('waits for a slow static phase instead of finalizing without it', async () => {
    await addEvent(32, { t: 'dom:document_idle', documentId: 'doc-1' })
    // Idle finished first: the static phase is still running its rules.
    expect(await setDomDone(32, 'doc-1')).toBe('awaiting-static')
    await addEvent(32, { t: 'dom:document_end', documentId: 'doc-1' })
    expect(await setDomDone(32, 'doc-1')).toBe('ready')
  })

  it('rejects a resource event from a superseded document', async () => {
    await addEvent(33, { t: 'dom:document_end', documentId: 'doc-1' })
    expect(await addEvent(33, { t: 'req:done', u: 'https://x.test/a.js', documentId: 'doc-9' })).toBe(false)
    expect(await addEvent(33, { t: 'req:done', u: 'https://x.test/b.js', documentId: 'doc-1' })).toBe(true)
    const run = await popRun(33)
    expect(run?.resources?.facts.map((fact) => fact.url)).toEqual(['https://x.test/b.js'])
  })
})
