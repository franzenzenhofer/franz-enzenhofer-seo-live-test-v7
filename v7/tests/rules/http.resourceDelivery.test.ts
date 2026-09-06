import { describe, expect, it } from 'vitest'

import { resourceDeliveryRule } from '@/rules/http/resourceDelivery'
import type { ResourceFact } from '@/shared/resourceFacts'

const page = (facts?: ResourceFact[], coverage?: Record<string, unknown>) => ({
  html: '', url: 'https://ex.test/', doc: new DOMParser().parseFromString('<p/>', 'text/html'),
  resourceFacts: facts, resourceCoverage: coverage,
})

const run = (facts?: ResourceFact[], coverage?: Record<string, unknown>) =>
  resourceDeliveryRule.run(page(facts, coverage) as never, { globals: {} })

describe('rule: observed resource delivery', () => {
  it('reports failed subresources with their status or network error', async () => {
    const r = await run([
      { url: 'https://ex.test/a.js', type: 'script', status: 200, headers: { 'content-type': 'text/javascript', 'content-encoding': 'br', 'cache-control': 'max-age=60' } },
      { url: 'https://ex.test/b.css', type: 'stylesheet', status: 404, headers: { 'content-type': 'text/css' } },
      { url: 'https://ex.test/c.png', type: 'image', error: 'net::ERR_CONNECTION_RESET' },
    ])
    expect(r.type).toBe('error')
    expect(r.details?.['failedCount']).toBe(2)
    expect(r.message).toContain('2 of 3 observed subresources failed')
  })

  it('summarizes compression and cache validators without refetching anything', async () => {
    const r = await run([
      { url: 'https://ex.test/a.js', status: 200, headers: { 'content-type': 'application/javascript' } },
      { url: 'https://ex.test/b.css', status: 200, headers: { 'content-type': 'text/css', 'content-encoding': 'gzip', etag: 'W/"1"' } },
      { url: 'https://ex.test/c.png', status: 200, headers: { 'content-type': 'image/png', 'cache-control': 'max-age=3600' } },
    ])
    expect(r.type).toBe('info')
    expect(r.details?.['textualCount']).toBe(2)
    expect(r.details?.['uncompressedCount']).toBe(1)
    expect(r.details?.['uncacheableCount']).toBe(1)
    expect(r.details?.['tested']).toContain('No resource was refetched')
  })

  it('says the counts are a lower bound when the ledger was truncated', async () => {
    const coverage = { events: 5000, completed: 4000, retained: 1000, dropped: 3000, truncated: true }
    const r = await run([{ url: 'https://ex.test/a.js', status: 200 }], coverage)
    expect(r.message).toContain('lower bound')
    expect(r.message).toContain('3000 completed or failed observations')
  })

  it('does not pretend to have evidence when nothing was retained', async () => {
    const r = await run([], { events: 12, completed: 0, retained: 0, dropped: 0, truncated: false })
    expect(r.type).toBe('info')
    expect(r.message).toContain('no resource evidence was retained')

    const none = await run(undefined)
    expect(none.message).toContain('No subresource requests were captured')
  })
})
