import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DOM_QUIET_MS, DOM_SETTLE_MAX_MS, waitForDomQuiet } from '@/content/domSettle'

// jsdom delivers MutationObserver records as microtasks; only timers are faked.
const mutate = (root: HTMLElement) => { root.appendChild(document.createElement('p')) }
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

let root: HTMLElement
beforeEach(() => {
  vi.useFakeTimers()
  root = document.createElement('div')
  document.body.appendChild(root)
})
afterEach(() => { root.remove(); vi.useRealTimers() })

describe('waitForDomQuiet', () => {
  it('resolves quiet once nothing mutated for the quiet window', async () => {
    const outcome = waitForDomQuiet(root)
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS - 1)
    let settled = false
    outcome.then(() => { settled = true }).catch(() => {})
    await flush()
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await outcome).toBe('quiet')
  })

  it('every mutation re-arms the quiet window', async () => {
    const outcome = waitForDomQuiet(root, { quietMs: 100, maxMs: 10_000 })
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(80)
      mutate(root)
      await flush()
    }
    let settled = false
    outcome.then(() => { settled = true }).catch(() => {})
    await flush()
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(await outcome).toBe('quiet')
  })

  it('never waits past the bound while the page keeps mutating', async () => {
    const outcome = waitForDomQuiet(root)
    for (let elapsed = 0; elapsed < DOM_SETTLE_MAX_MS; elapsed += 100) {
      mutate(root)
      await flush()
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(await outcome).toBe('timeout')
  })

  it('stops at once when superseded, also when the signal is already aborted', async () => {
    const controller = new AbortController()
    const outcome = waitForDomQuiet(root, { signal: controller.signal })
    controller.abort('superseded')
    expect(await outcome).toBe('aborted')
    expect(await waitForDomQuiet(root, { signal: controller.signal })).toBe('aborted')
  })
})
