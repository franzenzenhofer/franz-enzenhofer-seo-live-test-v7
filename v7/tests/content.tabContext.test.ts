import { describe, expect, it, vi } from 'vitest'

type Reply = { tabId?: number } | undefined
type SendCallback = (response?: Reply) => void
type Outcome = { error?: string; response?: Reply }

/**
 * Emulates chrome.runtime.sendMessage in callback form: Chrome sets
 * runtime.lastError for the duration of the callback and reports
 * "Unchecked runtime.lastError" when the callback never reads it.
 */
const makeShim = (outcome: Outcome) => {
  const unchecked: string[] = []
  let pending: { message: string } | undefined
  let read = false
  const shim = {
    runtime: {
      get lastError() { read = true; return pending },
      sendMessage: (_msg: unknown, cb: SendCallback) => {
        setTimeout(() => {
          pending = outcome.error ? { message: outcome.error } : undefined
          read = false
          cb(outcome.response)
          if (pending && !read) unchecked.push(pending.message)
          pending = undefined
        }, 0)
      },
    },
  }
  return { shim, unchecked }
}

const load = async (outcome: Outcome) => {
  const ctx = makeShim(outcome)
  // @ts-expect-error test shim
  globalThis.chrome = ctx.shim
  vi.resetModules()
  const mod = await import('@/content/tabContext')
  return { ...ctx, ...mod }
}

describe('content tabContext', () => {
  it('resolves the tabId from the background reply', async () => {
    const { contentTabId, getContentTabId, unchecked } = await load({ response: { tabId: 42 } })
    await expect(contentTabId).resolves.toBe(42)
    expect(getContentTabId()).toBe(42)
    expect(unchecked).toEqual([])
  })

  it('reads lastError when the service worker is unreachable and rejects with its message', async () => {
    const message = 'Could not establish connection. Receiving end does not exist.'
    const { contentTabId, getContentTabId, unchecked } = await load({ error: message })
    await expect(contentTabId).rejects.toThrow(message)
    expect(getContentTabId()).toBeNull()
    expect(unchecked).toEqual([])
  })
})
