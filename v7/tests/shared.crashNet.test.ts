import { describe, it, expect, beforeEach } from 'vitest'

import { installCrashNet } from '@/shared/crashNet'

describe('crashNet', () => {
  let sent: unknown[]
  let target: EventTarget

  beforeEach(() => {
    sent = []
    target = new EventTarget()
    // @ts-expect-error test shim
    globalThis.chrome = {
      runtime: { id: 'test', sendMessage: async (m: unknown) => { sent.push(m); return undefined } },
    }
  })

  const fireRejection = (reason: unknown): void => {
    const ev = new Event('unhandledrejection')
    ;(ev as { reason?: unknown }).reason = reason
    target.dispatchEvent(ev)
  }

  it('forwards unhandledrejection via chrome.runtime.sendMessage', async () => {
    installCrashNet('offscreen', target)
    fireRejection(new Error('boom'))
    await Promise.resolve()
    expect(sent.length).toBe(1)
    const report = sent[0] as { channel: string; context: string; kind: string; message: string }
    expect(report.channel).toBe('crash')
    expect(report.context).toBe('offscreen')
    expect(report.kind).toBe('unhandledrejection')
    expect(report.message).toBe('boom')
  })

  it('forwards error events with message + stack', async () => {
    installCrashNet('background', target)
    const err = new Error('explode')
    const ev = new ErrorEvent('error', { message: 'explode', error: err })
    target.dispatchEvent(ev)
    await Promise.resolve()
    expect(sent.length).toBe(1)
    const report = sent[0] as { kind: string; message: string; stack: string }
    expect(report.kind).toBe('error')
    expect(report.message).toBe('explode')
    expect(report.stack.length).toBeGreaterThan(0)
  })

  it('is idempotent (second install is a no-op)', () => {
    installCrashNet('background', target)
    installCrashNet('background', target)
    fireRejection('once')
    expect(sent.length).toBe(1)
  })

  it('returns a dispose that detaches both listeners', () => {
    const dispose = installCrashNet('content', target)
    dispose()
    fireRejection('after-dispose')
    expect(sent.length).toBe(0)
  })
})
