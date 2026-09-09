import { describe, it, expect, vi, beforeEach } from 'vitest'

import { runPSI } from '@/shared/psi'

// chrome.storage.session shim that records every write. runPSI runs in the offscreen document,
// where chrome.storage does not exist, so the real code must never rely on it - and therefore
// must never write to it even when it happens to be present.
const session = new Map<string, unknown>()
const setSpy = vi.fn(async (o: Record<string, unknown>) => {
  Object.entries(o).forEach(([k, v]) => session.set(k, v))
})
const removeSpy = vi.fn(async (keys: string | string[]) => {
  ;(Array.isArray(keys) ? keys : [keys]).forEach((k) => session.delete(k))
})

const psiBody = { lighthouseResult: { categories: { performance: { score: 0.9 } } } }

beforeEach(() => {
  session.clear()
  setSpy.mockClear()
  removeSpy.mockClear()
  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      session: {
        get: async (k: string | null) => (k === null ? Object.fromEntries(session) : { [k]: session.get(k) }),
        set: setSpy,
        remove: removeSpy,
      },
    },
  }
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => psiBody }) as unknown as Response))
})

describe('runPSI has no persistent cache', () => {
  it('fetches again on every sequential call for the same url+strategy+key', async () => {
    await runPSI('https://ex.com', 'mobile', 'k')
    await runPSI('https://ex.com', 'mobile', 'k')
    await runPSI('https://ex.com', 'mobile', 'k')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('writes nothing to chrome.storage.session and leaves foreign keys alone', async () => {
    session.set('logs:1', ['keep me'])
    await runPSI('https://ex.com', 'mobile', 'k')
    await runPSI('https://ex.com', 'desktop', 'k')
    expect(setSpy).not.toHaveBeenCalled()
    expect(removeSpy).not.toHaveBeenCalled()
    expect([...session.keys()]).toEqual(['logs:1'])
    expect([...session.keys()].filter((k) => k.startsWith('psi:'))).toEqual([])
  })
})
