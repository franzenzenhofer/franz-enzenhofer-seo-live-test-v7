import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureOffscreenDocument } from '@/background/rules/offscreenDoc'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Emulates chrome.offscreen: "an installed extension can only have one open at
 * a time" - a second createDocument while one exists or is being created
 * rejects, exactly like Chrome.
 */
const makeShim = (initialDocs: number) => {
  let docs = initialDocs
  let creating = false
  const session: Record<string, unknown> = {}
  const createDocument = vi.fn(async () => {
    if (docs > 0 || creating) throw new Error('Only a single offscreen document may be created.')
    creating = true
    await tick()
    docs = 1
    creating = false
  })
  const shim = {
    offscreen: {
      Reason: { DOM_PARSER: 'DOM_PARSER' },
      hasDocument: async () => docs > 0,
      createDocument,
    },
    storage: {
      local: { get: async () => ({}) },
      session: {
        get: async (key: string) => ({ [key]: session[key] }),
        set: async (obj: Record<string, unknown>) => { Object.assign(session, obj) },
      },
    },
  }
  return { shim, createDocument }
}

describe('ensureOffscreenDocument', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('two tabs finalizing at once share a single createDocument', async () => {
    const { shim, createDocument } = makeShim(0)
    // @ts-expect-error test shim
    globalThis.chrome = shim
    const results = await Promise.all([ensureOffscreenDocument(1), ensureOffscreenDocument(2)])
    expect(results).toEqual([true, true])
    expect(createDocument).toHaveBeenCalledTimes(1)
  })

  it('reuses an existing document without creating another', async () => {
    const { shim, createDocument } = makeShim(1)
    // @ts-expect-error test shim
    globalThis.chrome = shim
    expect(await ensureOffscreenDocument(3)).toBe(true)
    expect(createDocument).not.toHaveBeenCalled()
  })

  it('creates again after the previous creation settled', async () => {
    const { shim, createDocument } = makeShim(0)
    // @ts-expect-error test shim
    globalThis.chrome = shim
    expect(await ensureOffscreenDocument(4)).toBe(true)
    expect(await ensureOffscreenDocument(5)).toBe(true)
    expect(createDocument).toHaveBeenCalledTimes(1)
  })
})
