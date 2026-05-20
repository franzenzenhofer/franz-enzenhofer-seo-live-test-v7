import { beforeEach, describe, expect, it, vi } from 'vitest'

import { subscribeStorage, __mux } from '@/shared/storage-multiplex'

type StorageHandler = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void

const installChromeStub = (): { fire: StorageHandler } => {
  const listeners: StorageHandler[] = []
  // @ts-expect-error test shim
  globalThis.chrome = {
    storage: { onChanged: {
      addListener: (fn: StorageHandler) => listeners.push(fn),
      removeListener: (fn: StorageHandler) => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1) },
    } },
  }
  return { fire: (changes, areaName) => listeners.forEach((l) => l(changes, areaName)) }
}

describe('storage multiplex', () => {
  beforeEach(() => { __mux.reset() })

  it('installs exactly one chrome listener regardless of subscriber count', () => {
    const { fire } = installChromeStub()
    const a = vi.fn(); const b = vi.fn(); const c = vi.fn()
    subscribeStorage('k1', a)
    subscribeStorage('k1', b)
    subscribeStorage('k2', c)
    expect(__mux.installed()).toBe(true)
    expect(__mux.count('k1')).toBe(2)
    expect(__mux.count('k2')).toBe(1)
    fire({ k1: { newValue: 1, oldValue: 0 } }, 'local')
    expect(a).toHaveBeenCalledWith(1, 0, 'local')
    expect(b).toHaveBeenCalledWith(1, 0, 'local')
    expect(c).not.toHaveBeenCalled()
  })

  it('dispose unsubscribes only the given handler', () => {
    const { fire } = installChromeStub()
    const a = vi.fn(); const b = vi.fn()
    const disposeA = subscribeStorage('k', a)
    subscribeStorage('k', b)
    disposeA()
    fire({ k: { newValue: 1, oldValue: 0 } }, 'local')
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledOnce()
    expect(__mux.count('k')).toBe(1)
  })

  it('handler throws are caught and do not block other handlers', () => {
    const { fire } = installChromeStub()
    const a = vi.fn(() => { throw new Error('bad') })
    const b = vi.fn()
    subscribeStorage('k', a)
    subscribeStorage('k', b)
    fire({ k: { newValue: 1, oldValue: 0 } }, 'local')
    expect(b).toHaveBeenCalledOnce()
  })
})
