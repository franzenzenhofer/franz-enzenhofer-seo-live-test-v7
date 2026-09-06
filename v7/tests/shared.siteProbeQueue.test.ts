import { describe, expect, it, vi } from 'vitest'

import { noteProbeResponse, SITE_PROBE_CONCURRENCY, withSiteProbe } from '@/shared/siteProbeQueue'

const deferred = () => {
  let release!: () => void
  const done = new Promise<void>((resolve) => { release = resolve })
  return { done, release }
}

describe('per-origin probe queue', () => {
  it('never runs more than two probes against one origin at a time', async () => {
    let active = 0
    let peak = 0
    const gate = deferred()
    const probe = (url: string) => withSiteProbe(url, undefined, async () => {
      active += 1
      peak = Math.max(peak, active)
      await gate.done
      active -= 1
      return url
    })
    const all = Promise.all(['a', 'b', 'c', 'd'].map((path) => probe(`https://queue.test/${path}`)))
    await Promise.resolve()
    expect(peak).toBe(SITE_PROBE_CONCURRENCY)
    gate.release()
    await all
    expect(peak).toBe(SITE_PROBE_CONCURRENCY)
  })

  it('runs different origins in parallel', async () => {
    const seen: string[] = []
    await Promise.all(['https://one.test/a', 'https://two.test/a', 'https://three.test/a']
      .map((url) => withSiteProbe(url, undefined, async () => { seen.push(new URL(url).origin) })))
    expect(new Set(seen).size).toBe(3)
  })

  it('stops queued probes for at least a minute after a 429 and reports it', async () => {
    const response = { status: 429, headers: new Headers({ 'retry-after': '5' }) } as unknown as Response
    noteProbeResponse('https://limited.test/robots.txt', response)
    await expect(withSiteProbe('https://limited.test/a', undefined, async () => 'ran'))
      .rejects.toThrow(/rate limited/)
  })

  it('does not retry on its own after a Retry-After date in the past', async () => {
    const response = { status: 503, headers: new Headers({ 'retry-after': new Date(Date.now() - 1000).toUTCString() }) } as unknown as Response
    noteProbeResponse('https://slow.test/robots.txt', response)
    // A past Retry-After still yields the one-minute floor, never an instant retry.
    await expect(withSiteProbe('https://slow.test/a', undefined, async () => 'ran')).rejects.toThrow(/rate limited/)
  })

  it('refuses non-http probes and honours an already-aborted signal', async () => {
    await expect(withSiteProbe('ftp://x.test/a', undefined, async () => 'ran')).rejects.toThrow()
    const controller = new AbortController()
    controller.abort(new Error('run cancelled'))
    const run = vi.fn()
    await expect(withSiteProbe('https://abort.test/a', controller.signal, run)).rejects.toThrow('run cancelled')
    expect(run).not.toHaveBeenCalled()
  })

  it('drops a waiting probe when its own caller cancels, freeing the slot for others', async () => {
    const gate = deferred()
    const holders = [0, 1].map((index) =>
      withSiteProbe(`https://wait.test/hold-${index}`, undefined, async () => { await gate.done }))
    const controller = new AbortController()
    const waiting = withSiteProbe('https://wait.test/queued', controller.signal, async () => 'queued')
    const rejection = expect(waiting).rejects.toThrow('caller gone')
    controller.abort(new Error('caller gone'))
    await rejection
    gate.release()
    await Promise.all(holders)
    await expect(withSiteProbe('https://wait.test/after', undefined, async () => 'after')).resolves.toBe('after')
  })
})
