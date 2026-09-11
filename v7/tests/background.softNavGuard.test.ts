import { beforeEach, describe, expect, it } from 'vitest'

// Real store over an in-memory session shim: a soft-navigation record accepts
// only the capture that was requested for its URL after the history update.
const data: Record<string, unknown> = {}
const keys = (key: string | string[]) => (Array.isArray(key) ? key : [key])
// @ts-expect-error test shim
globalThis.chrome = {
  storage: {
    session: {
      get: async (key: string | string[]) => Object.fromEntries(keys(key).map((k) => [k, data[k]])),
      set: async (obj: Record<string, unknown>) => { Object.assign(data, obj) },
      remove: async (key: string | string[]) => { for (const k of keys(key)) delete data[k] },
    },
    local: { get: async () => ({}), set: async () => {}, remove: async () => {} },
  },
}

const { acceptsSoftNavPhase } = await import('@/background/pipeline/softNavGuard')
const { addEvent, peekRun, startSoftNavRun } = await import('@/background/pipeline/store')

const B = 'https://app.test/b'
const AT = 1_000
const run = { id: 1, ev: [], softNav: { url: B, at: AT } }
const phase = (url: string, capturedAt: number, t = 'dom:document_end') =>
  ({ t, u: url, documentId: 'doc-1', d: { version: 1, captureId: `c-${capturedAt}`, phase: 'static', url, capturedAt, chunkCount: 0, facts: { phase: 'static', nodeCount: 1, elements: [] } } })

beforeEach(() => { for (const key of Object.keys(data)) delete data[key] })

describe('acceptsSoftNavPhase', () => {
  it('accepts the capture taken at the requested URL after the update', () => {
    expect(acceptsSoftNavPhase(run, phase(B, AT + 5))).toBe(true)
    expect(acceptsSoftNavPhase(run, phase(`${B}#top`, AT + 5))).toBe(true)
  })

  it('drops a capture of the previous route and one taken before the update', () => {
    expect(acceptsSoftNavPhase(run, phase('https://app.test/a', AT + 5))).toBe(false)
    expect(acceptsSoftNavPhase(run, phase(B, AT - 1))).toBe(false)
  })

  it('is indifferent to non-phase events and to records without a soft navigation', () => {
    expect(acceptsSoftNavPhase(run, { t: 'req:done', u: 'https://app.test/x.js' })).toBe(true)
    expect(acceptsSoftNavPhase({ id: 1, ev: [] }, phase('https://app.test/a', 0))).toBe(true)
  })
})

describe('store: a soft-navigation record', () => {
  it('replaces the previous record, keeps the document identity and filters phases by the guard', async () => {
    await addEvent(3, { t: 'nav:commit', u: 'https://app.test/a', documentId: 'doc-1' })
    await startSoftNavRun(3, { t: 'nav:history', u: B, documentId: 'doc-1' }, false, AT)
    expect(await peekRun(3)).toMatchObject({ id: AT, documentId: 'doc-1', softNav: { url: B, at: AT }, ev: [{ t: 'nav:history', u: B }] })
    expect(await addEvent(3, phase('https://app.test/a', AT + 1))).toBe(false)
    expect(await addEvent(3, phase(B, AT - 1))).toBe(false)
    expect(await addEvent(3, phase(B, AT + 1))).toBe(true)
    expect(await addEvent(3, { t: 'req:done', u: 'https://app.test/x.js', s: 200, documentId: 'doc-1' })).toBe(true)
    expect((await peekRun(3))?.ev.map((e) => e.t)).toEqual(['nav:history', 'dom:document_end'])
  })

  it('marks a carried-over Run test as manual', async () => {
    await startSoftNavRun(4, { t: 'nav:history', u: B, documentId: 'doc-1' }, true, AT)
    expect((await peekRun(4))?.manual).toBe(true)
  })
})
