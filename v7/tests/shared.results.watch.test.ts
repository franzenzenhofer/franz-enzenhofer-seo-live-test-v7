import { describe, it, expect, vi } from 'vitest'

// @ts-expect-error test shim
globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn(async (k: string) => ({ [k]: [{ label: 'A', message: 'm', type: 'ok' }] })),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
}

import { readResults, watchResults } from '@/shared/results'

describe('shared/results', () => {
  it('reads results list', async () => {
    const rows = await readResults(1)
    expect(rows.length).toBe(1)
    expect(rows[0].label).toBe('A')
  })
  it('watches for changes', async () => {
    const cb = vi.fn()
    const unsub = watchResults(2, cb)
    const handler = (chrome.storage.onChanged.addListener as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    handler({ ['results:2']: { newValue: [{ label: 'B', message: 'x', type: 'warn' }] } }, 'local')
    expect(cb).toHaveBeenCalled()
    unsub()
    expect((chrome.storage.onChanged.removeListener as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled()
  })
})

