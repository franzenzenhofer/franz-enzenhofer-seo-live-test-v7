import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The content script asks the background for its tab id at import time; the
// shim answers like the background does (tabIdPls -> { tabId }).
vi.stubGlobal('chrome', {
  runtime: {
    lastError: undefined,
    sendMessage: (message: unknown, callback?: (response: unknown) => void) => {
      if (message === 'tabIdPls') callback?.({ tabId: 7 })
      return Promise.resolve(undefined)
    },
  },
})

const { handleRecaptureMessage, recaptureRoute } = await import('@/content/recapture')
const { DOM_QUIET_MS } = await import('@/content/domSettle')
const { RECAPTURE_MESSAGE } = await import('@/shared/softNavigation')

const B = 'https://app.test/b'
type Env = Parameters<typeof recaptureRoute>[1]
const env = (href: string | (() => string), onCapture?: (event: string) => Promise<void>) => {
  const captured: string[] = []
  const root = document.createElement('div')
  document.body.appendChild(root)
  const value: NonNullable<Env> = {
    root,
    href: typeof href === 'string' ? () => href : href,
    capture: async (event) => { captured.push(event); await onCapture?.(event) },
  }
  return { value, captured, root }
}
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

describe('recaptureRoute', () => {
  it('waits for the DOM to go quiet, then captures static and idle phases in order', async () => {
    const { value, captured, root } = env(B)
    const outcome = recaptureRoute(B, value)
    root.appendChild(document.createElement('h1'))
    await flush()
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS - 10)
    expect(captured).toEqual([])
    await vi.advanceTimersByTimeAsync(20)
    expect(await outcome).toBe('captured')
    expect(captured).toEqual(['document_end', 'document_idle'])
  })

  it('never captures under a URL the document has already left', async () => {
    const { value, captured } = env('https://app.test/c')
    const outcome = recaptureRoute(B, value)
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS)
    expect(await outcome).toBe('url-mismatch')
    expect(captured).toEqual([])
  })

  it('stops between the phases when the route moves on mid-capture', async () => {
    let href = B
    const { value, captured } = env(() => href, async (event) => { if (event === 'document_end') href = 'https://app.test/c' })
    const outcome = recaptureRoute(B, value)
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS)
    expect(await outcome).toBe('url-mismatch')
    expect(captured).toEqual(['document_end'])
  })

  it('a newer request supersedes a pending one: only the last URL is captured', async () => {
    const first = env(B)
    const second = env('https://app.test/c')
    const outcomeB = recaptureRoute(B, first.value)
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS / 2)
    const outcomeC = recaptureRoute('https://app.test/c', second.value)
    expect(await outcomeB).toBe('superseded')
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS)
    expect(await outcomeC).toBe('captured')
    expect(first.captured).toEqual([])
    expect(second.captured).toEqual(['document_end', 'document_idle'])
  })
})

describe('handleRecaptureMessage', () => {
  it('acknowledges the background\'s request at once and runs the capture asynchronously', async () => {
    const { value, captured } = env(B)
    const reply = vi.fn()
    expect(handleRecaptureMessage({ type: RECAPTURE_MESSAGE, url: B }, reply, value)).toBe(true)
    expect(reply).toHaveBeenCalledWith({ ok: true })
    expect(captured).toEqual([])
    await vi.advanceTimersByTimeAsync(DOM_QUIET_MS)
    await flush()
    expect(captured).toEqual(['document_end', 'document_idle'])
  })

  it('leaves every other message to the other handlers', () => {
    const reply = vi.fn()
    expect(handleRecaptureMessage({ type: 'getPageInfo' }, reply)).toBe(false)
    expect(handleRecaptureMessage({ type: RECAPTURE_MESSAGE }, reply)).toBe(false)
    expect(reply).not.toHaveBeenCalled()
  })
})
